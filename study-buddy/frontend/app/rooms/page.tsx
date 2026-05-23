"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useTheme } from "@/lib/theme";
import { apiCreateRoom, apiJoinRoom, fetchRooms, type StudyRoom } from "@/lib/rooms";

type RoomDraft = {
  title: string;
  subject: string;
  description: string;
  roomMode: string;
};

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

const FLOATERS: Floater[] = [
  { src: "/images/16.png", w: 80, top: "6%", left: "0%", anim: "animate-float-slow", delay: "0s" },
  { src: "/images/21.png", w: 70, top: "20%", right: "0%", anim: "animate-float-medium", delay: "1.3s" },
  { src: "/images/13.png", w: 75, bottom: "22%", left: "0%", anim: "animate-float-fast", delay: "0.7s" },
  { src: "/images/23.png", w: 72, bottom: "8%", right: "0%", anim: "animate-float-slow", delay: "1.9s" },
];

const EMPTY_DRAFT: RoomDraft = { title: "", subject: "", description: "", roomMode: "pomodoro" };

export default function RoomsLobbyPage() {
  const { theme } = useTheme();
  const dark = theme === "dark";
  const { getToken } = useAuth();
  const router = useRouter();

  const [draft, setDraft] = useState(EMPTY_DRAFT);
  const [inviteCode, setInviteCode] = useState("");
  const [rooms, setRooms] = useState<StudyRoom[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getToken().then(async (token) => {
      if (!token || cancelled) return;
      try {
        const nextRooms = await fetchRooms(token);
        if (!cancelled) setRooms(nextRooms);
      } catch {
        if (!cancelled) setRooms([]);
      } finally {
        if (!cancelled) setLoadingRooms(false);
      }
    });
    return () => { cancelled = true; };
  }, [getToken]);

  async function handleCreateRoom(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.title.trim()) return;
    const token = await getToken();
    if (!token) return;
    try {
      const next = await apiCreateRoom(token, {
        title: draft.title,
        subject: draft.subject || undefined,
        description: draft.description || undefined,
        roomMode: draft.roomMode,
      });
      setNotice(`Created room ${next.room.inviteCode}`);
      setDraft(EMPTY_DRAFT);
      router.push(`/rooms/${next.room.id}`);
    } catch (err) {
      setNotice("Could not create room.");
      console.error(err);
    }
  }

  async function handleJoinRoom(e: React.FormEvent) {
    e.preventDefault();
    if (!inviteCode.trim()) return;
    const token = await getToken();
    if (!token) return;
    try {
      const next = await apiJoinRoom(token, inviteCode.trim());
      setInviteCode("");
      setNotice(`Joined room ${next.room.title}`);
      router.push(`/rooms/${next.room.id}`);
    } catch {
      setNotice("Invite code not found.");
    }
  }

  return (
    <main className="relative min-h-screen overflow-x-hidden animate-gradient-bg">
      <div aria-hidden className="pointer-events-none fixed top-[-100px] left-[-100px] h-[380px] w-[380px] rounded-full blur-3xl opacity-25 animate-float-slow" style={{ background: "#CB438B" }} />
      <div aria-hidden className="pointer-events-none fixed top-[28%] right-[-120px] h-[340px] w-[340px] rounded-full blur-3xl opacity-18 animate-float-medium" style={{ background: "#BF3556" }} />
      <div aria-hidden className="pointer-events-none fixed bottom-[-80px] left-[8%] h-[260px] w-[260px] rounded-full blur-3xl opacity-18 animate-float-fast" style={{ background: "#6C6A43" }} />

      {FLOATERS.map((f, i) => (
        <span
          key={i}
          aria-hidden
          className={`pointer-events-none fixed ${f.anim}`}
          style={{ top: f.top, bottom: f.bottom, left: f.left, right: f.right, animationDelay: f.delay, opacity: 0.7, zIndex: 1 }}
        >
          <Image src={f.src} alt="" width={f.w} height={f.w} className="object-contain" />
        </span>
      ))}

      <div className="sticky top-0 z-50 px-4 pt-3 sm:px-6">
        <header className="mx-auto flex max-w-6xl items-center justify-between rounded-2xl border px-5 py-3 shadow-xl backdrop-blur-xl" style={{ background: "var(--nav-glass)", borderColor: "var(--nav-border)" }}>
          <Link href="/dashboard" className="flex items-center gap-2 text-sm font-bold transition-all hover:scale-105 text-fg-primary">
            <Image src={dark ? "/images/1.png" : "/images/5.png"} alt="" width={22} height={22} className="object-contain" />
            ← Dashboard
          </Link>
          <span className="hidden font-display text-base font-bold italic text-fg-primary sm:block">Study Rooms</span>
          <ThemeToggle />
        </header>
      </div>

      <section className="relative z-10 flex min-h-[calc(100vh-88px)] flex-col items-center justify-center gap-8 px-4 py-10 sm:px-6 lg:px-8">
        <div className="max-w-4xl text-center">
          <p className="text-[10px] font-bold uppercase tracking-[0.3em]" style={{ color: "#CB438B" }}>Live study space</p>
          <h1 className="mt-4 font-display text-5xl font-bold leading-[1.02] italic text-fg-primary sm:text-6xl lg:text-7xl">Create a room or join your crew.</h1>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-fg-secondary sm:text-lg">This page stays simple. Start a room or enter an invite code, then you’ll be taken to the room page where the live board lives.</p>
        </div>

        {notice ? <p className="rounded-2xl px-4 py-3 text-sm" style={{ background: dark ? "rgba(203,67,139,0.12)" : "rgba(203,67,139,0.10)", color: "var(--fg-primary)" }}>{notice}</p> : null}

        <div className="grid w-full max-w-4xl gap-4 md:grid-cols-2">
          <form onSubmit={handleCreateRoom} className="rounded-[2rem] border p-5 shadow-2xl backdrop-blur-2xl" style={{ background: dark ? "rgba(20,6,12,0.80)" : "rgba(255,246,234,0.84)", borderColor: "rgba(203,67,139,0.24)" }}>
            <p className="text-xs font-bold uppercase tracking-[0.25em]" style={{ color: "#CB438B" }}>Create room</p>
            <div className="mt-4 space-y-3">
              <input value={draft.title} onChange={(e) => setDraft((prev) => ({ ...prev, title: e.target.value }))} placeholder="Biology sprint" className="w-full rounded-2xl border px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#CB438B]" style={{ background: dark ? "#2A0E15" : "#fff", borderColor: "rgba(203,67,139,0.25)" }} />
              <input value={draft.subject} onChange={(e) => setDraft((prev) => ({ ...prev, subject: e.target.value }))} placeholder="Subject or topic" className="w-full rounded-2xl border px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#CB438B]" style={{ background: dark ? "#2A0E15" : "#fff", borderColor: "rgba(203,67,139,0.25)" }} />
              <textarea value={draft.description} onChange={(e) => setDraft((prev) => ({ ...prev, description: e.target.value }))} placeholder="What is this room for?" rows={3} className="w-full rounded-2xl border px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#CB438B]" style={{ background: dark ? "#2A0E15" : "#fff", borderColor: "rgba(203,67,139,0.25)" }} />
              <select value={draft.roomMode} onChange={(e) => setDraft((prev) => ({ ...prev, roomMode: e.target.value }))} className="w-full rounded-2xl border px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#CB438B]" style={{ background: dark ? "#2A0E15" : "#fff", borderColor: "rgba(203,67,139,0.25)" }}>
                <option value="pomodoro">Pomodoro room</option>
                <option value="focus">Focus room</option>
                <option value="study">Study lounge</option>
              </select>
              <button type="submit" className="w-full rounded-2xl px-5 py-3 text-sm font-bold text-white transition-all hover:scale-[1.01]" style={{ background: "linear-gradient(135deg,#CB438B,#BF3556)" }}>Create and enter</button>
            </div>
          </form>

          <form onSubmit={handleJoinRoom} className="rounded-[2rem] border p-5 shadow-2xl backdrop-blur-2xl" style={{ background: dark ? "rgba(20,6,12,0.72)" : "rgba(255,246,234,0.80)", borderColor: "rgba(203,67,139,0.24)" }}>
            <p className="text-xs font-bold uppercase tracking-[0.25em]" style={{ color: "#CB438B" }}>Join room</p>
            <p className="mt-2 text-sm text-fg-secondary">Paste the invite code and jump straight into the room.</p>
            <div className="mt-4 space-y-3">
              <input value={inviteCode} onChange={(e) => setInviteCode(e.target.value.toUpperCase())} placeholder="ABC123" className="w-full rounded-2xl border px-4 py-3 text-sm uppercase tracking-[0.2em] outline-none focus:ring-2 focus:ring-[#CB438B]" style={{ background: dark ? "#2A0E15" : "#fff", borderColor: "rgba(203,67,139,0.25)" }} />
              <button type="submit" className="w-full rounded-2xl border px-5 py-3 text-sm font-bold transition-all hover:scale-[1.01] text-fg-primary" style={{ borderColor: "rgba(203,67,139,0.35)", background: dark ? "rgba(203,67,139,0.08)" : "rgba(203,67,139,0.06)" }}>Join and enter</button>
            </div>
          </form>
        </div>

        <div className="w-full max-w-4xl rounded-[2rem] border p-5 shadow-2xl backdrop-blur-2xl" style={{ background: dark ? "rgba(20,6,12,0.72)" : "rgba(255,246,234,0.80)", borderColor: "rgba(203,67,139,0.18)" }}>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.25em]" style={{ color: "#CB438B" }}>Recent rooms</p>
              <p className="mt-1 text-sm text-fg-secondary">Quick continue links if you already have a room.</p>
            </div>
            {loadingRooms ? <span className="text-xs text-fg-secondary">Loading…</span> : null}
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {rooms.slice(0, 4).map((room) => (
              <Link key={room.id} href={`/rooms/${room.id}`} className="rounded-3xl border p-4 transition-all hover:scale-[1.01]" style={{ background: dark ? "rgba(203,67,139,0.05)" : "rgba(203,67,139,0.04)", borderColor: "rgba(203,67,139,0.16)" }}>
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold text-fg-primary">{room.title}</p>
                  <span className="rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em]" style={{ background: dark ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.55)", color: "#CB438B" }}>{room.inviteCode}</span>
                </div>
                <p className="mt-1 text-xs text-fg-secondary">{room.subject ?? room.description ?? "Open study room"}</p>
              </Link>
            ))}
            {!loadingRooms && rooms.length === 0 ? <div className="rounded-3xl border border-dashed p-5 text-sm text-fg-secondary">No rooms yet. Create one above.</div> : null}
          </div>
        </div>
      </section>
    </main>
  );
}