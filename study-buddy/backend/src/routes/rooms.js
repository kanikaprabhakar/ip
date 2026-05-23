import { Router } from "express";
import {
	listRooms,
	createRoom,
	joinRoom,
	getRoom,
	leaveRoom,
	removeRoomMember,
	endRoom,
	addRoomTask,
	toggleRoomTask,
	deleteRoomTask,
	addRoomMessage,
} from "../controllers/rooms.js";

const router = Router();

router.get("/", listRooms);
router.post("/", createRoom);
router.post("/join", joinRoom);
router.get("/:id", getRoom);
router.post("/:id/leave", leaveRoom);
router.delete("/:id/members/:memberId", removeRoomMember);
router.post("/:id/end", endRoom);
router.post("/:id/tasks", addRoomTask);
router.patch("/:id/tasks/:taskId", toggleRoomTask);
router.delete("/:id/tasks/:taskId", deleteRoomTask);
router.post("/:id/messages", addRoomMessage);

export default router;