"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useTheme } from "@/lib/theme";
import {
  apiCreateRoomTask,
  apiEndRoom,
  apiLeaveRoom,
  apiRemoveRoomMember,
  apiSendRoomMessage,
  apiToggleRoomTask,
  fetchRoom,
  type StudyRoomDetail,
} from "@/lib/rooms";

const BACKGROUNDS = [
  { src: "/backgrounds/download%20(4).jfif", label: "Study Desk" },
  { src: "/backgrounds/download%20(5).jfif", label: "Cozy Room" },
  { src: "/backgrounds/download%20(6).jfif", label: "Night Vibes" },
  { src: "/backgrounds/download%20(7).jfif", label: "Soft Focus" },
  { src: "/backgrounds/sticker%20laptop%20acer%20_%20my%20macbook%20wallpaper.jfif", label: "Laptop Sticker" },
] as const;

type Mode = "focus" | "short" | "long";

const MODE_LABELS: Record<Mode, string> = {
  focus: "Focus",
  short: "Short Break",
  long: "Long Break",
};

const MODE_MINUTES: Record<Mode, number> = {
  focus: 25,
  short: 5,
  long: 15,
};

function secsForMode(mode: Mode) {
  return MODE_MINUTES[mode] * 60;
}

function fmtCountdown(secs: number) {
  const minutes = Math.floor(secs / 60).toString().padStart(2, "0");
  const seconds = (secs % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}

const FLOATERS: Floater[] = [
  { src: "/images/16.png", w: 80, top: "6%", left: "0%", anim: "animate-float-slow", delay: "0s" },
  { src: "/images/21.png", w: 70, top: "20%", right: "0%", anim: "animate-float-medium", delay: "1.3s" },
  { src: "/images/13.png", w: 75, bottom: "22%", left: "0%", anim: "animate-float-fast", delay: "0.7s" },
  { src: "/images/23.png", w: 72, bottom: "8%", right: "0%", anim: "animate-float-slow", delay: "1.9s" },
];

type Floater = {
  src: string;
  w: number;
  top?: string;
  bottom?: string;
  left?: string;
  right?: string;
  anim: string;
  delay: string;
};

function fmtTime(value: string | null) {
  if (!value) return "";
  return new Date(value).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function fmtDate(value: string) {
  return new Date(value).toLocaleDateString([], { month: "short", day: "numeric" });
}

export default function RoomPage() {
  const params = useParams<{ id: string }>();
  const roomId = params?.id;
  const router = useRouter();
  const { theme } = useTheme();
  const dark = theme === "dark";
  const { getToken, userId } = useAuth();

  const [detail, setDetail] = useState<StudyRoomDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [taskTitle, setTaskTitle] = useState("");
  const [message, setMessage] = useState("");
  const [inviteCopy, setInviteCopy] = useState("Copy invite");
  const [notice, setNotice] = useState<string | null>(null);
  const [bgIdx, setBgIdx] = useState(0);
  const [mode, setMode] = useState<Mode>("focus");
  const [timeLeft, setTimeLeft] = useState(secsForMode("focus"));
  const [running, setRunning] = useState(false);
  const [sessions, setSessions] = useState(0);

  const room = detail?.room ?? null;
  const isHost = Boolean(room && userId && room.ownerClerkId === userId);
  const timerRef = useRef<number | null>(null);
  const tokenRef = useRef<string | null>(null);
  const leaveSuppressedRef = useRef(false);

  useEffect(() => {
    if (!roomId) return;
    leaveSuppressedRef.current = false;
    setLoading(true);
    setNotice(null);
    try {
      const raw = localStorage.getItem(`sb_room_timer:${roomId}`);
      if (!raw) {
        setBgIdx(0);
        setMode("focus");
        setTimeLeft(secsForMode("focus"));
        setRunning(false);
        setSessions(0);
        return;
      }
      const saved = JSON.parse(raw) as { bgIdx?: number; mode?: Mode; timeLeft?: number; running?: boolean; sessions?: number };
      if (typeof saved.bgIdx === "number") setBgIdx(saved.bgIdx);
      if (saved.mode) setMode(saved.mode);
      if (typeof saved.timeLeft === "number") setTimeLeft(saved.timeLeft);
      if (typeof saved.running === "boolean") setRunning(saved.running);
      if (typeof saved.sessions === "number") setSessions(saved.sessions);
    } catch {
      setBgIdx(0);
      setMode("focus");
      setTimeLeft(secsForMode("focus"));
      setRunning(false);
      setSessions(0);
    }
  }, [roomId]);

  useEffect(() => {
    if (!roomId) return;
    try {
      localStorage.setItem(`sb_room_timer:${roomId}`, JSON.stringify({ bgIdx, mode, timeLeft, running, sessions }));
    } catch {
      // Ignore storage failures.
    }
  }, [bgIdx, mode, roomId, running, sessions, timeLeft]);

  useEffect(() => {
    if (!running) return;
    timerRef.current = window.setInterval(() => {
      setTimeLeft((current) => {
        if (current <= 1) {
          if (timerRef.current) window.clearInterval(timerRef.current);
          timerRef.current = null;
          setRunning(false);
          setSessions((value) => value + 1);
          return 0;
        }
        return current - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
      timerRef.current = null;
    };
  }, [running]);

  useEffect(() => {
    if (!roomId) return;
    let cancelled = false;

    async function load() {
      const token = await getToken();
      if (!token || cancelled) return;
      tokenRef.current = token;
      try {
        const next = await fetchRoom(token, roomId);
        if (!cancelled) {
          setDetail(next);
          if (next.room.status === "ended") setNotice("This room has ended.");
        }
      } catch {
        if (!cancelled) {
          setDetail(null);
          setNotice("Room not found or you are no longer active in it.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    const poll = window.setInterval(() => {
      void load();
    }, 5000);

    return () => {
      cancelled = true;
      window.clearInterval(poll);
      if (!leaveSuppressedRef.current && tokenRef.current) {
        void apiLeaveRoom(tokenRef.current, roomId).catch(() => {});
      }
    };
  }, [getToken, roomId]);

  const refresh = useCallback(async () => {
    if (!roomId) return;
    const token = tokenRef.current ?? (await getToken());
    if (!token) return;
    tokenRef.current = token;
    const next = await fetchRoom(token, roomId);
    setDetail(next);
  }, [getToken, roomId]);

  async function handleAddTask(e: React.FormEvent) {
    e.preventDefault();
    if (!roomId || !taskTitle.trim() || room?.status === "ended") return;
    const token = tokenRef.current ?? (await getToken());
    if (!token) return;
    try {
      tokenRef.current = token;
      const created = await apiCreateRoomTask(token, roomId, taskTitle.trim());
      setTaskTitle("");
      setDetail((prev) => (prev ? { ...prev, tasks: [...prev.tasks, created], room: { ...prev.room, taskCount: prev.room.taskCount + 1 } } : prev));
      await refresh();
    } catch {
      setNotice("Could not add task.");
    }
  }

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!roomId || !message.trim() || room?.status === "ended") return;
    const token = tokenRef.current ?? (await getToken());
    if (!token) return;
    try {
      tokenRef.current = token;
      const sent = await apiSendRoomMessage(token, roomId, message.trim());
      setMessage("");
      setDetail((prev) => (prev ? { ...prev, messages: [...prev.messages, sent], room: { ...prev.room, messageCount: prev.room.messageCount + 1, lastMessageAt: sent.createdAt } } : prev));
      await refresh();
    } catch {
      setNotice("Could not send message.");
    }
  }

  async function handleToggleTask(taskId: string, done: boolean) {
    if (!roomId || room?.status === "ended") return;
    const token = tokenRef.current ?? (await getToken());
    if (!token) return;
    try {
      tokenRef.current = token;
      const updated = await apiToggleRoomTask(token, roomId, taskId, !done);
      setDetail((prev) => (prev ? { ...prev, tasks: prev.tasks.map((task) => (task.id === taskId ? updated : task)) } : prev));
      await refresh();
    } catch {
      setNotice("Could not update task.");
    }
  }

  async function handleLeaveRoom() {
    if (!roomId) return;
    const token = tokenRef.current ?? (await getToken());
    if (!token) return;
    leaveSuppressedRef.current = true;
    try {
      await apiLeaveRoom(token, roomId);
      router.push("/rooms");
    } catch {
      leaveSuppressedRef.current = false;
      setNotice("Could not leave the room.");
    }
  }

  async function handleEndRoom() {
    if (!roomId || !isHost) return;
    const token = tokenRef.current ?? (await getToken());
    if (!token) return;
    leaveSuppressedRef.current = true;
    try {
      await apiEndRoom(token, roomId);
      router.push("/rooms");
    } catch {
      leaveSuppressedRef.current = false;
      setNotice("Could not end the room.");
    }
  }

  async function handleRemoveMember(memberId: string) {
    if (!roomId || !isHost) return;
    const token = tokenRef.current ?? (await getToken());
    if (!token) return;
    try {
      tokenRef.current = token;
      await apiRemoveRoomMember(token, roomId, memberId);
      await refresh();
    } catch {
      setNotice("Could not remove that member.");
    }
  }

  async function copyInvite() {
    if (!room?.inviteCode) return;
    try {
      await navigator.clipboard.writeText(room.inviteCode);
      setInviteCopy("Copied");
      window.setTimeout(() => setInviteCopy("Copy invite"), 1600);
    } catch {
      setInviteCopy("Copy failed");
    }
  }

  function switchMode(nextMode: Mode) {
    setMode(nextMode);
    setTimeLeft(secsForMode(nextMode));
    setRunning(false);
  }

  if (!roomId) return null;

  return (
    <main className="relative min-h-screen overflow-x-hidden animate-gradient-bg">
      <div aria-hidden className="pointer-events-none fixed inset-0 bg-cover bg-center opacity-20" style={{ backgroundImage: `url(${BACKGROUNDS[bgIdx].src})` }} />
      <div aria-hidden className="pointer-events-none fixed top-[-100px] left-[-100px] h-[380px] w-[380px] rounded-full blur-3xl opacity-25 animate-float-slow" style={{ background: "#CB438B" }} />
      <div aria-hidden className="pointer-events-none fixed top-[28%] right-[-120px] h-[340px] w-[340px] rounded-full blur-3xl opacity-18 animate-float-medium" style={{ background: "#BF3556" }} />
      <div aria-hidden className="pointer-events-none fixed bottom-[-80px] left-[8%] h-[260px] w-[260px] rounded-full blur-3xl opacity-18 animate-float-fast" style={{ background: "#6C6A43" }} />

      {FLOATERS.map((floater, index) => (
        <span key={index} aria-hidden className={`pointer-events-none fixed ${floater.anim}`} style={{ top: floater.top, bottom: floater.bottom, left: floater.left, right: floater.right, animationDelay: floater.delay, opacity: 0.7, zIndex: 1 }}>
          <Image src={floater.src} alt="" width={floater.w} height={floater.w} className="object-contain" />
        </span>
      ))}

      <div className="sticky top-0 z-50 px-4 pt-3 sm:px-6">
        <header className="mx-auto flex max-w-6xl items-center justify-between rounded-2xl border px-5 py-3 shadow-xl backdrop-blur-xl" style={{ background: "var(--nav-glass)", borderColor: "var(--nav-border)" }}>
          <Link href="/rooms" className="flex items-center gap-2 text-sm font-bold transition-all hover:scale-105 text-fg-primary">
            <Image src={dark ? "/images/1.png" : "/images/5.png"} alt="" width={22} height={22} className="object-contain" />
            ← Rooms
          </Link>
          <div className="flex items-center gap-3">
            {room?.status === "ended" ? <span className="rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.22em] text-fg-secondary" style={{ borderColor: "rgba(203,67,139,0.2)" }}>Ended</span> : null}
            <span className="hidden font-display text-base font-bold italic text-fg-primary sm:block">Study Room</span>
          </div>
          <ThemeToggle />
        </header>
      </div>

      <section className="relative mx-auto flex min-h-[calc(100vh-88px)] max-w-6xl items-center px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid w-full gap-6 lg:grid-cols-[1.02fr_0.98fr]">
          <div className="space-y-6">
            <div className="rounded-[2rem] border p-5 shadow-2xl backdrop-blur-2xl sm:p-6" style={{ background: dark ? "rgba(20,6,12,0.82)" : "rgba(255,246,234,0.84)", borderColor: "rgba(203,67,139,0.24)" }}>
              <p className="text-[10px] font-bold uppercase tracking-[0.28em]" style={{ color: "#CB438B" }}>Live room</p>
              <h1 className="mt-2 font-display text-4xl font-bold italic text-fg-primary sm:text-5xl">{room?.title ?? (loading ? "Loading room…" : "Room not found")}</h1>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-fg-secondary">{room?.subject ?? room?.description ?? "A shared space for focused study, live tasks, and room chat."}</p>

              <div className="mt-6 overflow-hidden rounded-[2rem] border p-5" style={{ background: "linear-gradient(135deg, rgba(203,67,139,0.18), rgba(191,53,86,0.15))", borderColor: "rgba(203,67,139,0.24)" }}>
                <div className="flex items-center justify-between gap-3 text-white">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.24em] opacity-80">Invite code</p>
                    <p className="mt-2 font-display text-4xl font-bold italic tracking-[0.3em]">{room?.inviteCode ?? "------"}</p>
                  </div>
                  <button type="button" onClick={copyInvite} className="rounded-full border border-white/30 bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-white backdrop-blur-md transition-all hover:scale-[1.01]">{inviteCopy}</button>
                </div>
                <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-white/90">
                  <span>{room ? `${room.memberCount} active members` : ""}</span>
                  <span>{room?.lastMessageAt ? `Last message ${fmtTime(room.lastMessageAt)}` : room ? `Created ${fmtDate(room.createdAt)}` : ""}</span>
                </div>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <StatPill label="Members" value={room?.memberCount ?? 0} />
                <StatPill label="Tasks" value={room?.taskCount ?? 0} />
                <StatPill label="Chat" value={room?.messageCount ?? 0} />
              </div>
            </div>

            <div className="rounded-[2rem] border p-5 shadow-2xl backdrop-blur-2xl sm:p-6" style={{ background: dark ? "rgba(20,6,12,0.78)" : "rgba(255,246,234,0.84)", borderColor: "rgba(203,67,139,0.24)" }}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.22em]" style={{ color: "#CB438B" }}>Timer</p>
                  <p className="mt-1 text-sm text-fg-secondary">Switch the room backdrop and keep the session moving.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {BACKGROUNDS.map((background, index) => (
                    <button key={background.label} type="button" onClick={() => setBgIdx(index)} className="overflow-hidden rounded-2xl border transition-all hover:scale-[1.02]" style={{ borderColor: index === bgIdx ? "#CB438B" : "rgba(203,67,139,0.16)", boxShadow: index === bgIdx ? "0 0 0 2px rgba(203,67,139,0.18)" : "none" }}>
                      <Image src={background.src} alt={background.label} width={72} height={48} className="h-12 w-18 object-cover" />
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-5 rounded-[2rem] border p-5 text-center" style={{ background: `linear-gradient(160deg, rgba(203,67,139,0.16), rgba(191,53,86,0.1)), url(${BACKGROUNDS[bgIdx].src}) center/cover`, borderColor: "rgba(203,67,139,0.18)" }}>
                <div className="rounded-[1.75rem] border border-white/20 bg-black/30 p-5 backdrop-blur-md">
                  <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/80">{MODE_LABELS[mode]}</p>
                  <p className="mt-3 font-display text-6xl font-bold italic text-white sm:text-7xl">{fmtCountdown(timeLeft)}</p>
                  <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                    {(Object.keys(MODE_LABELS) as Mode[]).map((nextMode) => (
                      <button key={nextMode} type="button" onClick={() => switchMode(nextMode)} className="rounded-full border px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-white transition-all hover:scale-[1.02]" style={{ borderColor: mode === nextMode ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.25)", background: mode === nextMode ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.08)" }}>
                        {MODE_LABELS[nextMode]}
                      </button>
                    ))}
                  </div>
                  <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
                    <button type="button" onClick={() => setRunning((value) => !value)} className="rounded-full px-6 py-3 text-sm font-bold text-white transition-all hover:scale-[1.02]" style={{ background: "linear-gradient(135deg,#CB438B,#BF3556)" }}>
                      {running ? "Pause" : "Start"}
                    </button>
                    <button type="button" onClick={() => { setRunning(false); setTimeLeft(secsForMode(mode)); }} className="rounded-full border px-6 py-3 text-sm font-bold transition-all hover:scale-[1.02]" style={{ borderColor: "rgba(255,255,255,0.35)", color: "white" }}>
                      Reset
                    </button>
                  </div>
                  <p className="mt-4 text-xs text-white/75">Completed sessions: {sessions}</p>
                </div>
              </div>
            </div>

            <div className="rounded-[2rem] border p-4" style={{ background: dark ? "rgba(203,67,139,0.07)" : "rgba(203,67,139,0.05)", borderColor: "rgba(203,67,139,0.18)" }}>
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-bold uppercase tracking-[0.22em]" style={{ color: "#CB438B" }}>Members inside</p>
                <div className="flex gap-2">
                  {isHost ? (
                    <button type="button" onClick={handleEndRoom} className="rounded-full border px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] transition-all hover:scale-[1.02]" style={{ borderColor: "rgba(191,53,86,0.3)", color: "#BF3556" }}>
                      End room
                    </button>
                  ) : null}
                  <button type="button" onClick={handleLeaveRoom} className="rounded-full border px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] transition-all hover:scale-[1.02]" style={{ borderColor: "rgba(203,67,139,0.2)", color: "var(--fg-primary)" }}>
                    Leave room
                  </button>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {detail?.members.map((member) => (
                  <div key={member.id} className="flex items-center gap-2 rounded-full border px-3 py-1 text-xs" style={{ borderColor: "rgba(203,67,139,0.18)", background: dark ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.62)", color: "var(--fg-primary)" }}>
                    <span>{member.name}</span>
                    {member.role === "owner" ? <span className="rounded-full bg-[#CB438B] px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-white">Host</span> : null}
                    {member.clerkId === userId ? <span className="rounded-full bg-[#6C6A43] px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-white">You</span> : null}
                    {isHost && member.clerkId !== userId ? (
                      <button type="button" onClick={() => void handleRemoveMember(member.clerkId)} className="rounded-full border border-[#BF3556]/25 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-[#BF3556] transition-all hover:scale-[1.02]">
                        Remove
                      </button>
                    ) : null}
                  </div>
                ))}
                {!loading && (detail?.members.length ?? 0) === 0 ? <span className="text-xs text-fg-secondary">No members loaded yet.</span> : null}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-[2rem] border p-5 shadow-2xl backdrop-blur-2xl sm:p-6" style={{ background: dark ? "rgba(20,6,12,0.78)" : "rgba(255,246,234,0.84)", borderColor: "rgba(203,67,139,0.24)" }}>
              <p className="text-xs font-bold uppercase tracking-[0.22em]" style={{ color: "#CB438B" }}>Room tasks</p>
              <form onSubmit={handleAddTask} className="mt-4 flex gap-3">
                <input value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} placeholder="Add a room task" className="min-w-0 flex-1 rounded-2xl border px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#CB438B]" style={{ background: dark ? "#2A0E15" : "#fff", borderColor: "rgba(203,67,139,0.25)" }} />
                <button type="submit" className="rounded-2xl px-4 py-3 text-sm font-bold text-white" style={{ background: "linear-gradient(135deg,#CB438B,#BF3556)" }}>Add</button>
              </form>
              <div className="mt-4 space-y-3">
                {detail?.tasks.map((task) => (
                  <button key={task.id} type="button" onClick={() => handleToggleTask(task.id, task.done)} className="flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left transition-all hover:scale-[1.01]" style={{ background: task.done ? "rgba(203,67,139,0.12)" : (dark ? "rgba(203,67,139,0.05)" : "rgba(203,67,139,0.04)"), borderColor: "rgba(203,67,139,0.16)" }}>
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border" style={{ borderColor: task.done ? "#6C6A43" : "#CB438B", background: task.done ? "#6C6A43" : "transparent" }}>{task.done ? "✓" : ""}</span>
                    <span className="min-w-0 flex-1 text-sm text-fg-primary" style={{ textDecoration: task.done ? "line-through" : "none", opacity: task.done ? 0.55 : 1 }}>{task.title}</span>
                  </button>
                ))}
                {!loading && (detail?.tasks.length ?? 0) === 0 ? <div className="rounded-2xl border border-dashed px-4 py-5 text-sm text-fg-secondary">No room tasks yet. Add one to keep everyone aligned.</div> : null}
              </div>
            </div>

            <div className="rounded-[2rem] border p-5 shadow-2xl backdrop-blur-2xl sm:p-6" style={{ background: dark ? "rgba(20,6,12,0.78)" : "rgba(255,246,234,0.84)", borderColor: "rgba(203,67,139,0.24)" }}>
              <p className="text-xs font-bold uppercase tracking-[0.22em]" style={{ color: "#CB438B" }}>Live chat</p>
              <div className="mt-4 max-h-[320px] space-y-3 overflow-auto pr-1">
                {detail?.messages.map((item) => (
                  <div key={item.id} className="rounded-3xl border px-4 py-3" style={{ background: dark ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.72)", borderColor: "rgba(203,67,139,0.14)" }}>
                    <div className="flex items-center justify-between gap-3 text-xs text-fg-secondary">
                      <span className="font-semibold text-fg-primary">{item.authorName ?? item.clerkId.slice(0, 8)}</span>
                      <span>{fmtTime(item.createdAt)}</span>
                    </div>
                    <p className="mt-2 text-sm text-fg-primary">{item.body}</p>
                  </div>
                ))}
                {!loading && (detail?.messages.length ?? 0) === 0 ? <div className="rounded-2xl border border-dashed px-4 py-5 text-sm text-fg-secondary">No messages yet. Say hi to the room.</div> : null}
              </div>
              <form onSubmit={handleSendMessage} className="mt-4 flex gap-3">
                <input value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Write a message..." className="min-w-0 flex-1 rounded-2xl border px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#CB438B]" style={{ background: dark ? "#2A0E15" : "#fff", borderColor: "rgba(203,67,139,0.25)" }} />
                <button type="submit" className="rounded-2xl px-4 py-3 text-sm font-bold text-white" style={{ background: "linear-gradient(135deg,#CB438B,#BF3556)" }}>Send</button>
              </form>
              {notice ? <p className="mt-3 rounded-2xl px-4 py-3 text-sm" style={{ background: dark ? "rgba(203,67,139,0.12)" : "rgba(203,67,139,0.10)", color: "var(--fg-primary)" }}>{notice}</p> : null}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function StatPill({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-3xl border px-4 py-3 text-center" style={{ background: "rgba(203,67,139,0.07)", borderColor: "rgba(203,67,139,0.14)" }}>
      <p className="text-lg font-bold text-fg-primary">{value}</p>
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-fg-secondary">{label}</p>
    </div>
  );
}