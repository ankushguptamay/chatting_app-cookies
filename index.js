import dotenv from "dotenv";
import express from "express";
import bodyParser from "body-parser";
import db from "./Model/index.js";
import { resolve } from "path";
import cors from "cors";
import { createServer } from "node:http";
import user from "./Route/user.js";
import { socketAuthenticator } from "./Middleware/verifyJWTToken.js";
import cookieParser from "cookie-parser";
import admin from "./Route/admin.js";
import { Server } from "socket.io";
import { v4 as uuid } from "uuid";
import {
  CHAT_JOINED,
  CHAT_LEAVED,
  NEW_MESSAGE,
  NEW_MESSAGE_ALERT,
  ONLINE_USERS,
  START_TYPING,
  STOP_TYPING,
} from "./Utils/event.js";

dotenv.config({ path: resolve(process.cwd(), ".env") });

const app = express();
const server = createServer(app);

db.sequelize
  .sync()
  .then(() => {
    // console.log("Database synced")
  })
  .catch((error) => console.log(error));

const corsOptions = {
  origin: [
    "http://127.0.0.1:5173",
    "http://localhost:4173",
    process.env.CLIENT_URL,
  ],
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true,
};

const io = new Server(server, {
  cors: corsOptions,
});

app.set("io", io);

app.use(bodyParser.json());
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors(corsOptions));

app.use("/user", user);
app.use("/admin", admin);
app.get("/", (req, res) => {
  res.send("Hello World!");
});

const userSocketIDs = new Map();
const onlineUsers = new Set();

io.use((socket, next) => {
  cookieParser()(
    socket.request,
    socket.request.res,
    async (err) => await socketAuthenticator(err, socket, next)
  );
});

io.on("connection", (socket) => {
  const user = socket.user;
  userSocketIDs.set(user.dataValues.id.toString(), socket.id);

  socket.on(NEW_MESSAGE, async ({ chatId, members, message }) => {
    const messageForRealTime = {
      message: message,
      id: uuid(),
      sender: {
        id: user.id,
        name: user.fullName,
        avatar_url: user.avatar_url,
      },
      chat: chatId,
      createdAt: new Date().toISOString(),
    };

    const messageForDB = {
      message: message,
      senderId: user.id,
      chatId: chatId,
      userName: user.fullName,
      avatar_url: user.avatar_url,
    };

    const membersSocket = getSockets(members);
    io.to(membersSocket).emit(NEW_MESSAGE, {
      chatId,
      message: messageForRealTime,
    });
    io.to(membersSocket).emit(NEW_MESSAGE_ALERT, { chatId });

    try {
      await db.chatMessage.create(messageForDB);
    } catch (error) {
      throw new Error(error);
    }
  });

  socket.on(START_TYPING, ({ members, chatId }) => {
    const membersSockets = getSockets(members);
    socket.to(membersSockets).emit(START_TYPING, { chatId });
  });

  socket.on(STOP_TYPING, ({ members, chatId }) => {
    const membersSockets = getSockets(members);
    socket.to(membersSockets).emit(STOP_TYPING, { chatId });
  });

  socket.on(CHAT_JOINED, ({ userId, members }) => {
    onlineUsers.add(userId.toString());

    const membersSocket = getSockets(members);
    io.to(membersSocket).emit(ONLINE_USERS, Array.from(onlineUsers));
  });

  socket.on(CHAT_LEAVED, ({ userId, members }) => {
    onlineUsers.delete(userId.toString());

    const membersSocket = getSockets(members);
    io.to(membersSocket).emit(ONLINE_USERS, Array.from(onlineUsers));
  });

  socket.on("disconnect", () => {
    userSocketIDs.delete(user.dataValues.id.toString());
    onlineUsers.delete(user.id.toString());
    socket.broadcast.emit(ONLINE_USERS, Array.from(onlineUsers));
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

export { userSocketIDs };
