import crypto from "node:crypto";
import sql from "../supabase.js";
import { requireAuth } from "../middleware/requireAuth.js";

function makeInviteCode() {
	return crypto.randomBytes(3).toString("hex").toUpperCase();
}

function mapRoomRow(row) {
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

function mapMemberRow(row) {
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

function mapTaskRow(row) {
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

function mapMessageRow(row) {
	return {
		id: String(row.id),
		roomId: String(row.roomId ?? row.room_id),
		clerkId: String(row.clerkId ?? row.clerk_id),
		body: String(row.body),
		createdAt: String(row.createdAt ?? row.created_at ?? new Date().toISOString()),
		authorName: row.authorName ? String(row.authorName) : null,
	};
}

async function getRoomAccess(roomId, clerkId) {
	const [room] = await sql`
		select
			r.id,
			r.invite_code as "inviteCode",
			r.title,
			r.subject,
			r.description,
			r.room_mode as "roomMode",
			r.status,
			r.clerk_id,
			r.created_at as "createdAt",
			r.updated_at as "updatedAt",
			u.name as "ownerName"
		from public.study_rooms r
		left join public.users u on u.clerk_id = r.clerk_id
		where r.id = ${roomId}
	`;

	if (!room) return { room: null, isOwner: false, isActiveMember: false };

	const [membership] = await sql`
		select id, role, active, joined_at as "joinedAt"
		from public.study_room_members
		where room_id = ${roomId} and clerk_id = ${clerkId}
	`;

	const isOwner = String(room.clerk_id) === String(clerkId);
	const isActiveMember = Boolean(membership?.active) || isOwner;

	return { room, isOwner, isActiveMember };
}

async function loadRoomDetail(roomId, clerkId) {
	const access = await getRoomAccess(roomId, clerkId);
	if (!access.room || (!access.isActiveMember && !access.isOwner)) return null;

	const [counts] = await sql`
		select
			coalesce((select count(*) from public.study_room_members m where m.room_id = r.id and m.active = true), 0)::int as "memberCount",
			coalesce((select count(*) from public.study_room_tasks t where t.room_id = r.id), 0)::int as "taskCount",
			coalesce((select count(*) from public.study_room_messages msg where msg.room_id = r.id), 0)::int as "messageCount",
			(select max(created_at) from public.study_room_messages msg where msg.room_id = r.id) as "lastMessageAt"
		from public.study_rooms r
		where r.id = ${roomId}
	`;

	const members = await sql`
		select m.id, m.clerk_id, m.role, m.active, m.joined_at, u.name, u.email
		from public.study_room_members m
		left join public.users u on u.clerk_id = m.clerk_id
		where m.room_id = ${roomId} and m.active = true
		order by m.joined_at asc
	`;

	const tasks = await sql`
		select t.id, t.room_id, t.clerk_id, t.title, t.done, t.created_at, u.name as "createdByName"
		from public.study_room_tasks t
		left join public.users u on u.clerk_id = t.clerk_id
		where t.room_id = ${roomId}
		order by t.created_at asc
	`;

	const messages = await sql`
		select msg.id, msg.room_id, msg.clerk_id, msg.body, msg.created_at, u.name as "authorName"
		from public.study_room_messages msg
		left join public.users u on u.clerk_id = msg.clerk_id
		where msg.room_id = ${roomId}
		order by msg.created_at asc
		limit 120
	`;

	return {
		room: mapRoomRow({ ...access.room, ...counts }),
		members: members.map(mapMemberRow),
		tasks: tasks.map(mapTaskRow),
		messages: messages.map(mapMessageRow),
	};
}

export async function listRooms(req, res) {
	const clerkId = await requireAuth(req, res);
	if (!clerkId) return;
	try {
		const rows = await sql`
			select
				r.id,
				r.invite_code as "inviteCode",
				r.title,
				r.subject,
				r.description,
				r.room_mode as "roomMode",
				r.status,
				r.clerk_id,
				r.created_at as "createdAt",
				r.updated_at as "updatedAt",
				coalesce((select count(*) from public.study_room_members m where m.room_id = r.id and m.active = true), 0)::int as "memberCount",
				coalesce((select count(*) from public.study_room_tasks t where t.room_id = r.id), 0)::int as "taskCount",
				coalesce((select count(*) from public.study_room_messages msg where msg.room_id = r.id), 0)::int as "messageCount",
				(select max(created_at) from public.study_room_messages msg where msg.room_id = r.id) as "lastMessageAt",
				u.name as "ownerName"
			from public.study_rooms r
			left join public.users u on u.clerk_id = r.clerk_id
			where r.clerk_id = ${clerkId}
			   or exists (
				select 1 from public.study_room_members m
				where m.room_id = r.id and m.clerk_id = ${clerkId} and m.active = true
			   )
			order by coalesce((select max(created_at) from public.study_room_messages msg where msg.room_id = r.id), r.updated_at) desc,
			         r.created_at desc
		`;
		res.json(rows.map(mapRoomRow));
	} catch (err) {
		console.error("GET /api/rooms:", err);
		res.status(500).json({ error: "Database error" });
	}
}

export async function createRoom(req, res) {
	const clerkId = await requireAuth(req, res);
	if (!clerkId) return;
	const { title, subject, description, roomMode = "pomodoro" } = req.body ?? {};
	if (!title?.trim()) return res.status(400).json({ error: "title is required" });

	const mode = ["pomodoro", "focus", "study"].includes(String(roomMode)) ? String(roomMode) : "pomodoro";

	for (let attempt = 0; attempt < 3; attempt += 1) {
		const inviteCode = makeInviteCode();
		try {
			const [room] = await sql`
				insert into public.study_rooms (invite_code, clerk_id, title, subject, description, room_mode)
				values (${inviteCode}, ${clerkId}, ${title.trim()}, ${subject?.trim() ?? null}, ${description?.trim() ?? null}, ${mode})
				returning id
			`;
			await sql`
				insert into public.study_room_members (room_id, clerk_id, role)
				values (${room.id}, ${clerkId}, 'owner')
				on conflict (room_id, clerk_id)
				do update set role = excluded.role, active = true
			`;
			const detail = await loadRoomDetail(room.id, clerkId);
			return res.status(201).json(detail);
		} catch (err) {
			if (String(err?.code ?? "") === "23505") continue;
			console.error("POST /api/rooms:", err);
			return res.status(500).json({ error: "Database error" });
		}
	}

	return res.status(500).json({ error: "Could not generate invite code" });
}

export async function joinRoom(req, res) {
	const clerkId = await requireAuth(req, res);
	if (!clerkId) return;
	const inviteCode = String(req.body?.inviteCode ?? req.body?.code ?? "").trim().toUpperCase();
	if (!inviteCode) return res.status(400).json({ error: "inviteCode is required" });

	try {
		const [room] = await sql`
			select id from public.study_rooms where invite_code = ${inviteCode}
		`;
		if (!room) return res.status(404).json({ error: "Room not found" });

		await sql`
			insert into public.study_room_members (room_id, clerk_id, role)
			values (${room.id}, ${clerkId}, 'member')
			on conflict (room_id, clerk_id)
			do update set role = excluded.role, active = true
		`;

		const detail = await loadRoomDetail(room.id, clerkId);
		res.json(detail);
	} catch (err) {
		console.error("POST /api/rooms/join:", err);
		res.status(500).json({ error: "Database error" });
	}
}

export async function getRoom(req, res) {
	const clerkId = await requireAuth(req, res);
	if (!clerkId) return;
	try {
		const detail = await loadRoomDetail(req.params.id, clerkId);
		if (!detail) return res.status(404).json({ error: "Room not found" });
		if (String(detail.room.status) === "ended") return res.status(410).json({ error: "Room ended" });
		res.json(detail);
	} catch (err) {
		console.error("GET /api/rooms/:id:", err);
		res.status(500).json({ error: "Database error" });
	}
}

export async function addRoomTask(req, res) {
	const clerkId = await requireAuth(req, res);
	if (!clerkId) return;
	const { id } = req.params;
	const title = String(req.body?.title ?? "").trim();
	if (!title) return res.status(400).json({ error: "title is required" });

	try {
		const detail = await loadRoomDetail(id, clerkId);
		if (!detail) return res.status(404).json({ error: "Room not found" });
		if (String(detail.room.status) === "ended") return res.status(410).json({ error: "Room ended" });

		const [row] = await sql`
			insert into public.study_room_tasks (room_id, clerk_id, title)
			values (${id}, ${clerkId}, ${title})
			returning id, room_id, clerk_id, title, done, created_at
		`;
		const [author] = await sql`select name from public.users where clerk_id = ${clerkId}`;
		res.status(201).json(mapTaskRow({ ...row, createdByName: author?.name ?? null }));
	} catch (err) {
		console.error("POST /api/rooms/:id/tasks:", err);
		res.status(500).json({ error: "Database error" });
	}
}

export async function toggleRoomTask(req, res) {
	const clerkId = await requireAuth(req, res);
	if (!clerkId) return;
	const { id, taskId } = req.params;
	try {
		const detail = await loadRoomDetail(id, clerkId);
		if (!detail) return res.status(404).json({ error: "Room not found" });
		if (String(detail.room.status) === "ended") return res.status(410).json({ error: "Room ended" });

		const [row] = await sql`
			update public.study_room_tasks
			set done = coalesce(${req.body?.done}, not done)
			where id = ${taskId} and room_id = ${id}
			returning id, room_id, clerk_id, title, done, created_at
		`;
		if (!row) return res.status(404).json({ error: "Task not found" });
		const [author] = await sql`select name from public.users where clerk_id = ${row.clerk_id}`;
		res.json(mapTaskRow({ ...row, createdByName: author?.name ?? null }));
	} catch (err) {
		console.error("PATCH /api/rooms/:id/tasks/:taskId:", err);
		res.status(500).json({ error: "Database error" });
	}
}

export async function deleteRoomTask(req, res) {
	const clerkId = await requireAuth(req, res);
	if (!clerkId) return;
	const { id, taskId } = req.params;
	try {
		const detail = await loadRoomDetail(id, clerkId);
		if (!detail) return res.status(404).json({ error: "Room not found" });
		if (String(detail.room.status) === "ended") return res.status(410).json({ error: "Room ended" });
		await sql`delete from public.study_room_tasks where id = ${taskId} and room_id = ${id}`;
		res.status(204).end();
	} catch (err) {
		console.error("DELETE /api/rooms/:id/tasks/:taskId:", err);
		res.status(500).json({ error: "Database error" });
	}
}

export async function addRoomMessage(req, res) {
	const clerkId = await requireAuth(req, res);
	if (!clerkId) return;
	const { id } = req.params;
	const body = String(req.body?.body ?? "").trim();
	if (!body) return res.status(400).json({ error: "body is required" });

	try {
		const detail = await loadRoomDetail(id, clerkId);
		if (!detail) return res.status(404).json({ error: "Room not found" });
		if (String(detail.room.status) === "ended") return res.status(410).json({ error: "Room ended" });

		const [row] = await sql`
			insert into public.study_room_messages (room_id, clerk_id, body)
			values (${id}, ${clerkId}, ${body})
			returning id, room_id, clerk_id, body, created_at
		`;
		const [author] = await sql`select name from public.users where clerk_id = ${clerkId}`;
		res.status(201).json(mapMessageRow({ ...row, authorName: author?.name ?? null }));
	} catch (err) {
		console.error("POST /api/rooms/:id/messages:", err);
		res.status(500).json({ error: "Database error" });
	}
}

export async function leaveRoom(req, res) {
	const clerkId = await requireAuth(req, res);
	if (!clerkId) return;
	const { id } = req.params;
	try {
		const access = await getRoomAccess(id, clerkId);
		if (!access.room) return res.status(404).json({ error: "Room not found" });
		await sql`
			update public.study_room_members
			set active = false
			where room_id = ${id} and clerk_id = ${clerkId}
		`;
		res.status(204).end();
	} catch (err) {
		console.error("POST /api/rooms/:id/leave:", err);
		res.status(500).json({ error: "Database error" });
	}
}

export async function removeRoomMember(req, res) {
	const clerkId = await requireAuth(req, res);
	if (!clerkId) return;
	const { id, memberId } = req.params;
	try {
		const access = await getRoomAccess(id, clerkId);
		if (!access.room) return res.status(404).json({ error: "Room not found" });
		if (!access.isOwner) return res.status(403).json({ error: "Host only" });
		if (String(memberId) === String(clerkId)) return res.status(400).json({ error: "Use end room to close your own room" });
		await sql`
			update public.study_room_members
			set active = false
			where room_id = ${id} and clerk_id = ${memberId}
		`;
		res.status(204).end();
	} catch (err) {
		console.error("DELETE /api/rooms/:id/members/:memberId:", err);
		res.status(500).json({ error: "Database error" });
	}
}

export async function endRoom(req, res) {
	const clerkId = await requireAuth(req, res);
	if (!clerkId) return;
	const { id } = req.params;
	try {
		const access = await getRoomAccess(id, clerkId);
		if (!access.room) return res.status(404).json({ error: "Room not found" });
		if (!access.isOwner) return res.status(403).json({ error: "Host only" });
		await sql`
			update public.study_rooms
			set status = 'ended', updated_at = now()
			where id = ${id}
		`;
		await sql`
			update public.study_room_members
			set active = false
			where room_id = ${id}
		`;
		res.status(204).end();
	} catch (err) {
		console.error("POST /api/rooms/:id/end:", err);
		res.status(500).json({ error: "Database error" });
	}
}
