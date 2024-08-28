import db from "../Model/index.js";
import { NEW_REQUEST, REFETCH_CHATS, emitEvent } from "../Utils/event.js";
const Request = db.request;
const User = db.user;
const Chat = db.chat;
const Chat_User = db.chats_user;
import {
  sendFriendRequestValidation,
  acceptFriendRequestValidation,
} from "../Middleware/validation.js";
import { getSingleChat } from "../Utils/helper.js";
import { Op } from "sequelize";

export const sendFriendRequest = async (req, res) => {
  try {
    // Validate Body
    const { error } = sendFriendRequestValidation(req.body);
    if (error) {
      return res.status(400).send(error.details[0].message);
    }
    const { receiverId } = req.body;
    const { id, avatar_url, userName } = req.user;
    if (receiverId === id) {
      return res.status(400).json({
        success: false,
        message: "Bad request!",
      });
    }
    const request = await Request.findOne({
      where: {
        [Op.or]: [
          { [Op.and]: [{ "sender.id": id }, { receiverId: receiverId }] },
          { [Op.and]: [{ "sender.id": receiverId }, { receiverId: id }] },
        ],
      },
    });
    if (request) {
      return res.status(400).json({
        success: false,
        message: "Request already present!",
      });
    }
    await Request.create({
      status: "Pending",
      sender: { id: id, avatar_url: avatar_url, userName: userName },
      receiverId: receiverId,
    });

    emitEvent(req, NEW_REQUEST, [receiverId]);

    // Socket Event Will Fire to all members
    res.status(200).json({
      success: true,
      message: "Request sent successfully!",
    });
  } catch (err) {
    res.status(500).send({
      success: false,
      message: err.message,
    });
  }
};

export const myFriendRequest = async (req, res) => {
  try {
    const { id } = req.user;
    const request = await Request.findAll({
      where: { receiverId: id, status: "Pending" },
    });
    // Socket Event Will Fire to all members
    res.status(200).json({
      success: true,
      message: "Request fetched successfully!",
      data: request,
    });
  } catch (err) {
    res.status(500).send({
      success: false,
      message: err.message,
    });
  }
};

export const acceptFriendRequest = async (req, res) => {
  try {
    // Validate Body
    const { error } = acceptFriendRequestValidation(req.body);
    if (error) {
      return res.status(400).send(error.details[0].message);
    }
    const { accept } = req.body;
    const { id } = req.user;
    const request = await Request.findOne({
      where: {
        id: req.params.id,
        status: "Pending",
      },
    });
    if (!request) {
      return res.status(400).json({
        success: false,
        message: "Request is not present!",
      });
    }
    if (request.receiverId !== id) {
      return res.status(401).json({
        success: false,
        message: "You are not authorized to accept this request!",
      });
    }
    if (!accept) {
      await request.destroy();
      return res.status(200).json({
        success: true,
        message: "Friend request rejected!",
      });
    }
    let chat;
    const members = [request.sender.id, id];
    const newChat = await Chat.create({ isGroup: false });
    const users = [];
    for (let i = 0; i < members.length; i++) {
      const user = await User.findOne({ where: { id: members[i] } });
      const chat_user = await Chat_User.create({
        chatId: newChat.id,
        userId: members[i],
        userName: user.fullName,
        avatar_url: user.avatar_url,
      });
      users.push(chat_user);
    }
    await request.update({ ...request, status: "Accepted" });

    emitEvent(req, REFETCH_CHATS, members);

    // chat = { ...newChat.dataValues, members: users };
    // const transForm = getSingleChat(chat, req.user.id);

    // Socket Event Will Fire to all members
    res.status(200).json({
      success: true,
      message: "Request acceptd successfully!",
      senderId: request.sender.id,
    });
  } catch (err) {
    res.status(500).send({
      success: false,
      message: err.message,
    });
  }
};
