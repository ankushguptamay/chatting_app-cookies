import express from "express";

import {
  register,
  login,
  // logOut,
  getMe,
  searchUser,
  addUpdateUserAvatar,
  deleteUserAvatar,
} from "../Controller/user.js";
import {
  getUserChat,
  findChat,
  createMessage,
  getMessage,
  createGroupChat,
  addAdmins,
  addMembers,
  removeAdmins,
  removeMembers,
  deleteGroup,
  leaveGroup,
  deleteGroupAvatar,
  addUpdateGroupAvatar,
  findGroupChatMembers,
} from "../Controller/chat.js";
import {
  sendFriendRequest,
  myFriendRequest,
  acceptFriendRequest,
} from "../Controller/request.js";

const chat = express.Router();

// middleware
import { verifyUserJWT } from "../Middleware/verifyJWTToken.js";
import { isUserPresent } from "../Middleware/isPresent.js";
import uploadImage from "../Middleware/image.js";
import uploadImageAndPDF from "../Middleware/imageAndPDF.js";

chat.post("/register", register);
chat.post("/login", login);
// chat.get("/logOut", logOut);
chat.get("/", verifyUserJWT, getMe);
chat.get("/searchUser", verifyUserJWT, isUserPresent, searchUser);
chat.put(
  "/addUpdateUserAvatar",
  verifyUserJWT,
  isUserPresent,
  uploadImage.single("UserAvatar"),
  addUpdateUserAvatar
);
chat.put("/deleteUserAvatar", verifyUserJWT, isUserPresent, deleteUserAvatar);

chat.post("/createGroupChat", verifyUserJWT, isUserPresent, createGroupChat);
chat.get("/getUserChat", verifyUserJWT, isUserPresent, getUserChat);
chat.get("/findChat/:id", verifyUserJWT, isUserPresent, findChat);
chat.get("/members/:id", verifyUserJWT, isUserPresent, findGroupChatMembers);
chat.put("/addAdmins", verifyUserJWT, isUserPresent, addAdmins);
chat.put("/addMembers", verifyUserJWT, isUserPresent, addMembers);
chat.put("/removeAdmins", verifyUserJWT, isUserPresent, removeAdmins);
chat.put("/removeMembers", verifyUserJWT, isUserPresent, removeMembers);
chat.put("/leaveGroup/:id", verifyUserJWT, isUserPresent, leaveGroup);
chat.delete("/deleteGroup/:id", verifyUserJWT, isUserPresent, deleteGroup);
chat.put(
  "/deleteGroupAvatar/:id",
  verifyUserJWT,
  isUserPresent,
  deleteGroupAvatar
);
chat.put(
  "/addUpdateGroupAvatar/:id",
  verifyUserJWT,
  isUserPresent,
  uploadImage.single("GroupAvatar"),
  addUpdateGroupAvatar
);
chat.post(
  "/createMessage",
  verifyUserJWT,
  isUserPresent,
  uploadImageAndPDF.array("messageAttachment", 3),
  createMessage
);
chat.get("/messages/:id", verifyUserJWT, isUserPresent, getMessage);

chat.post(
  "/sendFriendRequest",
  verifyUserJWT,
  isUserPresent,
  sendFriendRequest
);
chat.get("/myFriendRequest", verifyUserJWT, isUserPresent, myFriendRequest);
chat.put(
  "/acceptFriendRequest/:id",
  verifyUserJWT,
  isUserPresent,
  acceptFriendRequest
);

export default chat;
