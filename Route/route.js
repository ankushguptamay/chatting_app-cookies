const express = require("express");

const {
  register,
  login,
  getMe,
  searchUser,
  addUpdateUserAvatar,
  deleteUserAvatar,
} = require("../Controller/user");
const {
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
} = require("../Controller/chat");
const {
  sendFriendRequest,
  myFriendRequest,
  acceptFriendRequest,
} = require("../Controller/request");

const chat = express.Router();

// middleware
const { verifyUserJWT } = require("../Middleware/verifyJWTToken");
const { isUserPresent } = require("../Middleware/isPresent");
const uploadImage = require("../Middleware/image");
const uploadImageAndPDF = require("../Middleware/imageAndPDF");

chat.post("/register", register);
chat.post("/login", login);
chat.get("/me", verifyUserJWT, getMe);
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

module.exports = chat;
