import { getSockets } from "./helper.js";

export const ALERT = "ALERT";
export const REFETCH_CHATS = "REFETCH_CHATS";

export const NEW_ATTACHMENT = "NEW_ATTACHMENT";
export const NEW_MESSAGE_ALERT = "NEW_MESSAGE_ALERT";

export const NEW_REQUEST = "NEW_REQUEST";
export const NEW_MESSAGE = "NEW_MESSAGE";

export const START_TYPING = "START_TYPING";
export const STOP_TYPING = "STOP_TYPING";

export const CHAT_JOINED = "CHAT_JOINED";
export const CHAT_LEAVED = "CHAT_LEAVED";

export const ONLINE_USERS = "ONLINE_USERS";

export const emitEvent = (req, event, users, data) => {
  const io = req.app.get("io");
  const usersSocket = getSockets(users);
  io.to(usersSocket).emit(event, data);
};
