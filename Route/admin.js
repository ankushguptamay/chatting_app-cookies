import express from "express";
import { register, login, getAdmin } from "../Controller/admin.js";
import { getAlluser } from "../Controller/user.js";
import { allChat, getDashboardStatus } from "../Controller/chat.js";

const chat = express.Router();

// middleware
import { verifyAdminJWT } from "../Middleware/verifyJWTToken.js";
import { isAdminPresent } from "../Middleware/isPresent.js";

chat.post("/register", register);
chat.post("/login", login);
// chat.post("/logOut", logOut);
chat.get("/", verifyAdminJWT, getAdmin);

chat.get("/users", verifyAdminJWT, isAdminPresent, getAlluser);
chat.get("/chats", verifyAdminJWT, isAdminPresent, allChat);
chat.get("/dashboard", verifyAdminJWT, isAdminPresent, getDashboardStatus);

export default chat;
