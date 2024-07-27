const express = require("express");
const { register, login, getAdmin, logOut } = require("../Controller/admin");
const { getAlluser } = require("../Controller/user");
const { allChat, getDashboardStatus } = require("../Controller/chat");
const {} = require("../Controller/request");

const chat = express.Router();

// middleware
const { verifyAdminJWT } = require("../Middleware/verifyJWTToken");
const { isAdminPresent } = require("../Middleware/isPresent");

chat.post("/register", register);
chat.post("/login", login);
chat.post("/logOut", logOut);
chat.get("/", verifyAdminJWT, getAdmin);

chat.get("/users", verifyAdminJWT, isAdminPresent, getAlluser);
chat.get("/chats", verifyAdminJWT, isAdminPresent, allChat);
chat.get("/dashboard", verifyAdminJWT, isAdminPresent, getDashboardStatus);

module.exports = chat;
