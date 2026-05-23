export interface StudyRoom {
  id: string;
  inviteCode: string;
  title: string;
  subject: string | null;
  description: string | null;
  roomMode: string;
  status: string;
  ownerClerkId: string;
  ownerName: string | null;
  createdAt: string;
  updatedAt: string;
  memberCount: number;
  taskCount: number;
  messageCount: number;
  lastMessageAt: string | null;
}

export interface StudyRoomMember {
  id: string;
  clerkId: string;
  name: string;
  email: string | null;
  role: string;
  active: boolean;
  joinedAt: string;
}

export interface StudyRoomTask {
  id: string;
  roomId: string;
  clerkId: string;
  title: string;
  done: boolean;
  createdAt: string;
  createdByName: string | null;
}

export interface StudyRoomMessage {
  id: string;
  roomId: string;
  clerkId: string;
  body: string;
  createdAt: string;
  authorName: string | null;
}

export interface StudyRoomDetail {
  room: StudyRoom;
  members: StudyRoomMember[];
  tasks: StudyRoomTask[];
  messages: StudyRoomMessage[];
}

const ENV_BASE = process.env.NEXT_PUBLIC_BACKEND_URL?.trim();
const BASE = ENV_BASE || (process.env.NODE_ENV === "development" ? "http://localhost:4000" : "");

function headers(token: string) {
  return { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
}

function buildUrl(path: string): string {
  if (!BASE) {
    throw new Error("Backend URL is not configured. Set NEXT_PUBLIC_BACKEND_URL in frontend environment variables.");
  }
  return `${BASE}${path}`;
}

async function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  const url = buildUrl(path);
  try {
    return await fetch(url, init);
  } catch {
    throw new Error(`Network error while calling backend: ${url}`);
  }
}

function normaliseRoom(row: Record<string, unknown>): StudyRoom {
  return {
    id: String(row.id),
    inviteCode: String(row.inviteCode ?? row.invite_code),
    title: String(row.title),
    subject: row.subject ? String(row.subject) : null,
    description: row.description ? String(row.description) : null,
    roomMode: String(row.roomMode ?? row.room_mode ?? "pomodoro"),
    status: String(row.status ?? "open"),
    ownerClerkId: String(row.ownerClerkId ?? row.clerk_id),
    ownerName: row.ownerName ? String(row.ownerName) : null,
    createdAt: String(row.createdAt ?? row.created_at ?? new Date().toISOString()),
    updatedAt: String(row.updatedAt ?? row.updated_at ?? new Date().toISOString()),
    memberCount: Number(row.memberCount ?? row.member_count ?? 0),
    taskCount: Number(row.taskCount ?? row.task_count ?? 0),
    messageCount: Number(row.messageCount ?? row.message_count ?? 0),
    lastMessageAt: row.lastMessageAt ? String(row.lastMessageAt) : null,
  };
}

function normaliseMember(row: Record<string, unknown>): StudyRoomMember {
  return {
    id: String(row.id),
    clerkId: String(row.clerkId ?? row.clerk_id),
    name: row.name ? String(row.name) : String(row.clerkId ?? row.clerk_id).slice(0, 8),
    email: row.email ? String(row.email) : null,
    role: String(row.role ?? "member"),
    active: Boolean(row.active ?? true),
    joinedAt: String(row.joinedAt ?? row.joined_at ?? new Date().toISOString()),
  };
}

function normaliseTask(row: Record<string, unknown>): StudyRoomTask {
  return {
    id: String(row.id),
    roomId: String(row.roomId ?? row.room_id),
    clerkId: String(row.clerkId ?? row.clerk_id),
    title: String(row.title),
    done: Boolean(row.done),
    createdAt: String(row.createdAt ?? row.created_at ?? new Date().toISOString()),
    createdByName: row.createdByName ? String(row.createdByName) : null,
  };
}

function normaliseMessage(row: Record<string, unknown>): StudyRoomMessage {
  return {
    id: String(row.id),
    roomId: String(row.roomId ?? row.room_id),
    clerkId: String(row.clerkId ?? row.clerk_id),
    body: String(row.body),
    createdAt: String(row.createdAt ?? row.created_at ?? new Date().toISOString()),
    authorName: row.authorName ? String(row.authorName) : null,
  };
}

function normaliseDetail(data: Record<string, unknown>): StudyRoomDetail {
  return {
    room: normaliseRoom((data.room ?? data) as Record<string, unknown>),
    members: Array.isArray(data.members) ? (data.members as Array<Record<string, unknown>>).map(normaliseMember) : [],
    tasks: Array.isArray(data.tasks) ? (data.tasks as Array<Record<string, unknown>>).map(normaliseTask) : [],
    messages: Array.isArray(data.messages) ? (data.messages as Array<Record<string, unknown>>).map(normaliseMessage) : [],
  };
}

export async function fetchRooms(token: string): Promise<StudyRoom[]> {
  const res = await apiFetch("/api/rooms", { headers: headers(token) });
  if (!res.ok) throw new Error(`fetchRooms: ${res.status}`);
  const rows = await res.json() as Array<Record<string, unknown>>;
  return rows.map(normaliseRoom);
}

export async function fetchRoom(token: string, roomId: string): Promise<StudyRoomDetail> {
  const res = await apiFetch(`/api/rooms/${roomId}`, { headers: headers(token) });
  if (!res.ok) throw new Error(`fetchRoom: ${res.status}`);
  return normaliseDetail(await res.json() as Record<string, unknown>);
}

export async function apiCreateRoom(
  token: string,
  data: { title: string; subject?: string; description?: string; roomMode?: string },
): Promise<StudyRoomDetail> {
  const res = await apiFetch("/api/rooms", {
    method: "POST",
    headers: headers(token),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`apiCreateRoom: ${res.status}`);
  return normaliseDetail(await res.json() as Record<string, unknown>);
}

export async function apiJoinRoom(token: string, inviteCode: string): Promise<StudyRoomDetail> {
  const res = await apiFetch("/api/rooms/join", {
    method: "POST",
    headers: headers(token),
    body: JSON.stringify({ inviteCode }),
  });
  if (!res.ok) throw new Error(`apiJoinRoom: ${res.status}`);
  return normaliseDetail(await res.json() as Record<string, unknown>);
}

export async function apiCreateRoomTask(token: string, roomId: string, title: string): Promise<StudyRoomTask> {
  const res = await apiFetch(`/api/rooms/${roomId}/tasks`, {
    method: "POST",
    headers: headers(token),
    body: JSON.stringify({ title }),
  });
  if (!res.ok) throw new Error(`apiCreateRoomTask: ${res.status}`);
  return normaliseTask(await res.json() as Record<string, unknown>);
}

export async function apiToggleRoomTask(token: string, roomId: string, taskId: string, done?: boolean): Promise<StudyRoomTask> {
  const res = await apiFetch(`/api/rooms/${roomId}/tasks/${taskId}`, {
    method: "PATCH",
    headers: headers(token),
    body: JSON.stringify({ done }),
  });
  if (!res.ok) throw new Error(`apiToggleRoomTask: ${res.status}`);
  return normaliseTask(await res.json() as Record<string, unknown>);
}

export async function apiDeleteRoomTask(token: string, roomId: string, taskId: string): Promise<void> {
  const res = await apiFetch(`/api/rooms/${roomId}/tasks/${taskId}`, {
    method: "DELETE",
    headers: headers(token),
  });
  if (!res.ok && res.status !== 204) throw new Error(`apiDeleteRoomTask: ${res.status}`);
}

export async function apiSendRoomMessage(token: string, roomId: string, body: string): Promise<StudyRoomMessage> {
  const res = await apiFetch(`/api/rooms/${roomId}/messages`, {
    method: "POST",
    headers: headers(token),
    body: JSON.stringify({ body }),
  });
  if (!res.ok) throw new Error(`apiSendRoomMessage: ${res.status}`);
  return normaliseMessage(await res.json() as Record<string, unknown>);
}

export async function apiLeaveRoom(token: string, roomId: string): Promise<void> {
  const res = await apiFetch(`/api/rooms/${roomId}/leave`, {
    method: "POST",
    headers: headers(token),
    keepalive: true,
  });
  if (!res.ok && res.status !== 204) throw new Error(`apiLeaveRoom: ${res.status}`);
}

export async function apiRemoveRoomMember(token: string, roomId: string, memberId: string): Promise<void> {
  const res = await apiFetch(`/api/rooms/${roomId}/members/${memberId}`, {
    method: "DELETE",
    headers: headers(token),
  });
  if (!res.ok && res.status !== 204) throw new Error(`apiRemoveRoomMember: ${res.status}`);
}

export async function apiEndRoom(token: string, roomId: string): Promise<void> {
  const res = await apiFetch(`/api/rooms/${roomId}/end`, {
    method: "POST",
    headers: headers(token),
  });
  if (!res.ok && res.status !== 204) throw new Error(`apiEndRoom: ${res.status}`);
}