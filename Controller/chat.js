import dotenv from "dotenv";
dotenv.config();

import db from "../Model/index.js";
import {
  createMessageValidation,
  createPrivateChat,
  createGroupChatValidation,
  addMembersValidation,
} from "../Middleware/validation.js";
const User = db.user;
const Chat = db.chat;
const Chat_User = db.chats_user;
const Message = db.chatMessage;
const MessageAttachment = db.messageAttachment;
import {
  ALERT,
  emitEvent,
  NEW_MESSAGE,
  NEW_MESSAGE_ALERT,
  REFETCH_CHATS,
} from "../Utils/event.js";
import {
  getOtherMember,
  getSingleChat,
  deleteSingleFile,
} from "../Utils/helper.js";
import { uploadFileToBunny, deleteFileToBunny } from "../Utils/bunny.js";
import fs from "fs";
const bunnyFolderName = "attachment";
import { Op } from "sequelize";

export const createGroupChat = async (req, res) => {
  try {
    // Validate Body
    const { error } = createGroupChatValidation(req.body);
    if (error) {
      return res.status(400).send(error.details[0].message);
    }
    const { members, chatName } = req.body;
    const userId = req.user.id;
    if (members.length < 2) {
      return res.status(400).json({
        success: false,
        message: "Chose atleast two members!",
      });
    }
    const membersArray = [...members, userId];
    // create chat
    const chat = await Chat.create({
      isGroup: true,
      chatName: chatName,
      creator: userId,
      avatar_url: null,
    });
    const users = [];
    let creatorName;
    for (let i = 0; i < membersArray.length; i++) {
      const user = await User.findOne({ where: { id: membersArray[i] } });
      if (user) {
        let isAdmin = false;
        if (userId === membersArray[i]) {
          creatorName = user.fullName;
          isAdmin = true;
        }
        const chat_user = await Chat_User.create({
          chatId: chat.id,
          userId: membersArray[i],
          userName: user.fullName,
          avatar_url: user.avatar_url,
          isAdmin: isAdmin,
        });
        users.push(chat_user);
      }
    }
    // Socket Event Will Fire to all members that `${chatName} group is created by ${creatorName}`;
    const response = { ...chat.dataValues, members: users };
    const transForm = getSingleChat(response, req.user.id);

    emitEvent(req, ALERT, membersArray, `Welcome to ${chatName} group`);
    emitEvent(req, REFETCH_CHATS, members);

    res.status(200).json({
      success: true,
      message: "Group created successfully!",
      data: transForm,
    });
  } catch (err) {
    res.status(500).send({
      success: false,
      message: err.message,
    });
  }
};

export const getUserChat = async (req, res) => {
  try {
    const userId = req.user.id;
    const chats = await Chat.findAll({
      include: [
        {
          model: Chat_User,
          as: "members",
          where: {
            userId: userId,
          },
          require: true,
        },
      ],
    });
    const chatIds = [];
    for (let i = 0; i < chats.length; i++) {
      chatIds.push(chats[i].id);
    }
    const chat = await Chat.findAll({
      where: { id: chatIds },
      include: [
        {
          model: Chat_User,
          as: "members",
        },
      ],
    });
    const transForm = chat.map(
      ({ id, chatName, members, isGroup, avatar_url, creator }) => {
        const otherMember = getOtherMember(members, userId);
        return {
          id,
          chatName: isGroup ? chatName : otherMember[0].userName,
          members: otherMember,
          isGroup,
          avatar_url: isGroup ? avatar_url : otherMember[0].avatar_url,
          creator,
        };
      }
    );
    res.status(200).json({
      success: true,
      message: "Chat fetched successfully!",
      data: transForm,
    });
  } catch (err) {
    res.status(500).send({
      success: false,
      message: err.message,
    });
  }
};

export const findChat = async (req, res) => {
  try {
    const chatId = req.params.id;
    const chat = await Chat.findOne({
      where: {
        id: chatId,
      },
      include: [
        {
          model: Chat_User,
          as: "members",
          attributes: ["userId", "avatar_url", "userName"],
        },
      ],
    });
    // const transForm = getSingleChat(chat, req.user.id);
    res.status(200).json({
      success: true,
      message: "Chat fetched successfully!",
      data: chat,
    });
  } catch (err) {
    res.status(500).send({
      success: false,
      message: err.message,
    });
  }
};

// Admin can add
export const addMembers = async (req, res) => {
  try {
    // Validate Body
    // const { error } = addMembers(req.body);
    // if (error) {
    //     return res.status(400).send(error.details[0].message);
    // }
    const { members, chatId } = req.body;
    const chat = await Chat.findOne({
      where: {
        id: chatId,
        isGroup: true,
      },
      include: [
        {
          model: Chat_User,
          as: "members",
          where: {
            userId: req.user.id,
            isAdmin: true,
          },
          require: true,
        },
      ],
    });
    if (!chat) {
      return res.status(400).json({
        success: false,
        message: "You can not add members!",
      });
    }
    const newAddedUserName = [];
    for (let i = 0; i < members.length; i++) {
      const user = await User.findOne({ where: { id: members[i] } });
      if (user) {
        const isAdmin = false;
        const isPresnet = await Chat_User.findOne({
          where: {
            chatId: chat.id,
            userId: members[i],
          },
        });
        if (!isPresnet) {
          await Chat_User.create({
            chatId: chat.id,
            userId: members[i],
            userName: user.fullName,
            avatar_url: user.avatar_url,
            isAdmin: isAdmin,
          });
          newAddedUserName.push(user.fullName);
        }
      }
    }
    // Socket Event Will Fire to all members
    const chat_user = await Chat_User.findAll({
      where: { chatId: chat.id },
      attributes: ["id", "userId", "userName"],
    });
    const users = [];
    for (let i = 0; i < chat_user.length; i++) {
      users.push(chat_user[i].userId);
    }

    emitEvent(
      req,
      ALERT,
      users,
      `${newAddedUserName} has been added in the group`
    );
    emitEvent(req, REFETCH_CHATS, users);

    res.status(200).json({
      success: true,
      message: "Member added successfully!",
    });
  } catch (err) {
    res.status(500).send({
      success: false,
      message: err.message,
    });
  }
};

// Only creator can remove
export const removeMembers = async (req, res) => {
  try {
    // // Validate Body
    // const { error } = addMembers(req.body);
    // if (error) {
    //     return res.status(400).send(error.details[0].message);
    // }
    const { members, chatId } = req.body;

    const chat = await Chat.findOne({
      where: {
        id: chatId,
        isGroup: true,
        creator: req.user.id,
      },
    });

    if (!chat) {
      return res.status(400).json({
        success: false,
        message: "You can not remove members!",
      });
    }

    for (let i = 0; i < members.length; i++) {
      await Chat_User.destroy({
        where: {
          chatId: chat.id,
          userId: members[i],
        },
      });
    }

    const userThatWillBeRemoved = [];
    const removedMembers = await User.findAll({
      where: { id: members },
      attributes: ["fullName"],
    });
    for (let i = 0; i < removedMembers.length; i++) {
      userThatWillBeRemoved.push(removedMembers[i].fullName);
    }

    // Socket Event Will Fire to all members
    const chat_user = await Chat_User.findAll({
      where: { chatId: chat.id },
      attributes: ["id", "userId", "userName"],
    });
    const remainUsers = [];
    for (let i = 0; i < chat_user.length; i++) {
      remainUsers.push(chat_user.userId);
    }
    const allUsers = [...remainUsers, members];
    emitEvent(req, ALERT, remainUsers, {
      message: `${userThatWillBeRemoved.name} has been removed from the group`,
      chatId,
    });
    emitEvent(req, REFETCH_CHATS, allUsers);

    // Socket Event Will Fire to all members
    res.status(200).json({
      success: true,
      message: "Member removed successfully!",
    });
  } catch (err) {
    res.status(500).send({
      success: false,
      message: err.message,
    });
  }
};

// Only creator can add Admin
export const addAdmins = async (req, res) => {
  try {
    // Validate Body
    const { error } = addMembersValidation(req.body);
    if (error) {
      return res.status(400).send(error.details[0].message);
    }
    const { members, chatId } = req.body;
    const chat = await Chat.findOne({
      where: {
        id: chatId,
        isGroup: true,
        creator: req.user.id,
      },
    });
    if (!chat) {
      return res.status(400).json({
        success: false,
        message: "You can not add members!",
      });
    }
    for (let i = 0; i < members.length; i++) {
      await Chat_User.update(
        { isAdmin: true },
        {
          where: {
            chatId: chat.dataValues.id,
            userId: members[i],
          },
        }
      );
    }
    // Socket Event Will Fire to all members
    res.status(200).json({
      success: true,
      message: "Admin addeded successfully!",
    });
  } catch (err) {
    console.log(err);
    res.status(500).send({
      success: false,
      message: err,
    });
  }
};

// Only creator can remove Admin
export const removeAdmins = async (req, res) => {
  try {
    // Validate Body
    // const { error } = addMembers(req.body);
    // if (error) {
    //     return res.status(400).send(error.details[0].message);
    // }
    const { members, chatId } = req.body;
    const chat = await Chat.findOne({
      where: {
        id: chatId,
        isGroup: true,
        creator: req.user.id,
      },
    });
    if (!chat) {
      return res.status(400).json({
        success: false,
        message: "You can not remove admins!",
      });
    }
    for (let i = 0; i < members.length; i++) {
      if (members[i] !== req.user.id) {
        await Chat_User.update(
          { isAdmin: false },
          {
            where: {
              chatId: chat.id,
              userId: members[i],
            },
          }
        );
      }
    }
    // Socket Event Will Fire to all members
    res.status(200).json({
      success: true,
      message: "Admin removed successfully!",
    });
  } catch (err) {
    res.status(500).send({
      success: false,
      message: err.message,
    });
  }
};

export const createMessage = async (req, res) => {
  try {
    const files = req.files;
    if (files?.length < 1) {
      return res.status(400).json({
        success: false,
        message: "Select at least one file!",
      });
    }
    // Validate Body
    const { error } = createMessageValidation(req.body);
    if (error) {
      return res.status(400).send(error.details[0].message);
    }
    const { chatId, message } = req.body;
    if (!files && !message) {
      return res.status(400).json({
        success: false,
        message: "Message can not be empty!",
      });
    }
    const senderId = req.user.id;
    let chat = await Message.create({
      senderId: senderId,
      message: message,
      chatId: chatId,
      avatar_url: req.user.avatar_url,
      userName: req.user.userName,
    });
    const attachments = [];
    if (files) {
      for (let i = 0; i < files.length; i++) {
        //Upload file
        const fileStream = fs.createReadStream(files[i].path);
        await uploadFileToBunny(bunnyFolderName, fileStream, files[i].filename);
        deleteSingleFile(files[i].path);
        const attachment = await MessageAttachment.create({
          mimeType:files[i].mimetype,
          attachment_url: files[i].path,
          attachmentName: `${process.env.SHOW_BUNNY_FILE_HOSTNAME}/${bunnyFolderName}/${files[i].filename}`,
          messageId: chat.id,
        });
        attachments.push(attachment);
      }
    }
    chat = {
      ...chat.dataValues,
      attachments: attachments,
    };

    const messageForRealTime = {
      sender: {
        id: senderId,
        name: req.user.userName,
        avatar_url: req.user.avatar_url,
      },
      message: message,
      chatId: chatId,
      attachments: attachments,
    };

    const chat_user = await Chat_User.findAll({
      where: { chatId: chat.id },
      attributes: ["id", "userId"],
    });
    const users = [];
    for (let i = 0; i < chat_user.length; i++) {
      users.push(chat_user.userId);
    }
    // Socket Event Will Fire to all members to send message;
    emitEvent(req, NEW_MESSAGE, users, {
      message: messageForRealTime,
      chatId,
    });

    emitEvent(req, NEW_MESSAGE_ALERT, users, { chatId });

    res.status(200).json({
      success: true,
      message: "Message created successfully!",
      data: chat,
    });
  } catch (err) {
    res.status(500).send({
      success: false,
      message: err.message,
    });
  }
};

export const getMessage = async (req, res) => {
  try {
    const { page } = req.query;
    // Pagination
    const recordLimit = 20;
    let offSet = 0;
    let currentPage = 1;
    if (page) {
      offSet = (parseInt(page) - 1) * recordLimit;
      currentPage = parseInt(page);
    }
    const chatId = req.params.id;
    // Count All Message
    const totalMessage = await Message.count({
      where: {
        chatId: chatId,
      },
    });
    const message = await Message.findAll({
      limit: recordLimit,
      offset: offSet,
      where: {
        chatId: chatId,
      },
      include: [
        {
          model: MessageAttachment,
          as: "attachments",
        },
      ],
      order: [["createdAt", "DESC"]],
    });
    res.status(200).json({
      success: true,
      message: "Message fetched successfully!",
      totalPage: Math.ceil(totalMessage / recordLimit),
      currentPage: currentPage,
      message: message,
    });
  } catch (err) {
    res.status(500).send({
      success: false,
      message: err.message,
    });
  }
};

export const leaveGroup = async (req, res) => {
  try {
    const chatId = req.params.id;

    const chat = await Chat.findOne({
      where: {
        id: chatId,
        isGroup: true,
      },
    });

    if (!chat) {
      return res.status(400).json({
        success: false,
        message: "Group is not present!",
      });
    }

    if (chat.creator === req.user.id) {
      return res.status(400).json({
        success: false,
        message: "Creator can not leave the group!",
      });
    }

    await Chat_User.destroy({
      where: {
        chatId: chat.id,
        userId: req.user.id,
      },
    });

    // Socket Event Will Fire to all members
    const chat_user = await Chat_User.findAll({
      where: { chatId: chat.id },
      attributes: ["id", "userId", "userName"],
    });
    const users = [];
    for (let i = 0; i < chat_user.length; i++) {
      users.push(chat_user.userId);
    }
    emitEvent(req, ALERT, users, {
      chatId,
      message: `User ${req.user.fullName} has left the group`,
    });
    res.status(200).json({
      success: true,
      message: "Group leaved successfully!",
    });
  } catch (err) {
    res.status(500).send({
      success: false,
      message: err.message,
    });
  }
};

export const deleteGroup = async (req, res) => {
  try {
    const chatId = req.params.id;
    const chat = await Chat.findOne({
      where: {
        id: chatId,
        isGroup: true,
      },
    });
    if (!chat) {
      return res.status(400).json({
        success: false,
        message: "Group is not present!",
      });
    }
    if (chat.creator !== req.user.id) {
      return res.status(400).json({
        success: false,
        message: "You can not delete this group!",
      });
    }

    const chat_user = await Chat_User.findAll({
      where: { chatId: chat.id },
      attributes: ["id", "userId", "userName"],
    });

    await Chat_User.destroy({
      where: {
        chatId: chat.id,
      },
    });
    // Socket Event Will Fire to all members
    await chat.destroy();
    const users = [];
    for (let i = 0; i < chat_user.length; i++) {
      users.push(chat_user.userId);
    }
    emitEvent(req, REFETCH_CHATS, users);

    res.status(200).json({
      success: true,
      message: "Group deleted successfully!",
    });
  } catch (err) {
    res.status(500).send({
      success: false,
      message: err.message,
    });
  }
};

export const addUpdateGroupAvatar = async (req, res) => {
  try {
    // File should be exist
    if (!req.file) {
      return res.status(400).send({
        success: false,
        message: "Please..upload an Avatar!",
      });
    }
    const chat = await Chat.findOne({
      where: {
        id: req.params.id,
        isGroup: true,
      },
    });
    if (!chat) {
      deleteSingleFile(chat.avatar_url);
      return res.status(400).json({
        success: false,
        message: "Group is not present!",
      });
    }
    const user = await Chat_User.findOne({
      where: { chatId: chat.id, userId: req.user.id },
    });
    if (!user) {
      deleteSingleFile(chat.avatar_url);
      return res.status(400).json({
        success: false,
        message: "Member is not present!",
      });
    }
    if (!user.isAdmin) {
      deleteSingleFile(chat.avatar_url);
      return res.status(400).json({
        success: false,
        message: "Only admin can add or update!!",
      });
    }
    //Upload file
    const fileStream = fs.createReadStream(req.file.path);
    await uploadFileToBunny(bunnyFolderName, fileStream, req.file.filename);
    deleteSingleFile(req.file.path);
    if (chat.avatar_url) {
      await deleteFileToBunny(bunnyFolderName, chat.fileName);
    }
    // Socket Event Will Fire to all members
    await chat.update({
      avatar_url: `${process.env.SHOW_BUNNY_FILE_HOSTNAME}/${bunnyFolderName}/${req.file.filename}`,
      fileName: req.file.filename,
    });
    // Final response
    res.status(200).send({
      success: true,
      message: "Avatar added successfully!",
    });
  } catch (err) {
    res.status(500).send({
      success: false,
      message: err.message,
    });
  }
};

export const deleteGroupAvatar = async (req, res) => {
  try {
    const chat = await Chat.findOne({
      where: {
        id: req.params.id,
        isGroup: true,
      },
    });
    if (!chat) {
      return res.status(400).json({
        success: false,
        message: "Group is not present!",
      });
    }
    const user = await Chat_User.findOne({
      where: { chatId: chat.id, userId: req.user.id },
    });
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Member is not present!",
      });
    }
    if (!user.isAdmin) {
      return res.status(400).json({
        success: false,
        message: "Only admin can add or update!!",
      });
    }
    if (chat.avatar_url) {
      await deleteFileToBunny(bunnyFolderName, chat.fileName);
    }
    await chat.update({ avatar_url: null, fileName: null });
    // Final response
    res.status(200).send({
      success: true,
      message: `Avatar deleted successfully!`,
    });
  } catch (err) {
    res.status(500).send({
      success: false,
      message: err.message,
    });
  }
};

export const allChat = async (req, res) => {
  try {
    const chat = await Chat.findAll({
      include: [
        {
          model: Chat_User,
          as: "members",
        },
      ],
    });
    const transFormChat = await Promise.all(
      chat.map(
        async ({ id, creator, isGroup, members, avatar_url, chatName }) => {
          let groupCreator;
          if (creator) {
            groupCreator = await User.findOne({
              where: { id: creator },
              attributes: ["avatar_url", "fullName", "id"],
            });
          }
          const totalMessage = await Message.count({ where: { chatId: id } });
          return {
            id,
            isGroup,
            avatar_url: avatar_url
              ? avatar_url
              : members
                  .slice(0, 3)
                  .map((member) => member.dataValues.avatar_url),
            members: members.map(({ id, userId, userName, avatar_url }) => ({
              id,
              userId,
              userName,
              avatar_url,
            })),
            chatName: chatName ? chatName : "Private",
            creator: groupCreator ? { ...groupCreator.dataValues } : "None",
            totalmembers: members.length,
            totalMessage,
          };
        }
      )
    );
    res.status(200).json({
      success: true,
      message: "Chat fetched successfully!",
      data: transFormChat,
    });
  } catch (err) {
    res.status(500).send({
      success: false,
      message: err.message,
    });
  }
};

export const getDashboardStatus = async (req, res) => {
  try {
    const today = new Date();
    const last7Days = new Date();
    const daysInMilliSecond = 1000 * 60 * 60 * 24;
    last7Days.setDate(last7Days.getDate() - 7);

    const [
      groupsCount,
      userCount,
      messageCount,
      totalChatCount,
      last7DaysMessage,
    ] = await Promise.all([
      Chat.count({ where: { isGroup: true } }),
      User.count(),
      Message.count(),
      Chat.count(),
      Message.findAll({
        where: { createdAt: { [Op.gte]: last7Days } },
        attributes: ["createdAt"],
      }),
    ]);

    const messages = new Array(7).fill(0);
    // console.log(last7DaysMessage);
    last7DaysMessage.forEach((message) => {
      const indexApprox =
        (today.getTime() - message.dataValues.createdAt.getTime()) /
        daysInMilliSecond;
      const index = Math.floor(indexApprox);
      messages[6 - index]++;
    });

    const status = {
      groupsCount,
      userCount,
      messageCount,
      totalChatCount,
      privateChat: totalChatCount - groupsCount,
      messageChart: messages,
    };

    res.status(200).json({
      success: true,
      message: "Dashboard fetched successfully!",
      data: status,
    });
  } catch (err) {
    res.status(500).send({
      success: false,
      message: err.message,
    });
  }
};

export const findGroupChatMembers = async (req, res) => {
  try {
    const chatId = req.params.id;
    const members = await Chat_User.findAll({
      where: {chatId: chatId},
      attributes: ["userId", "avatar_url", "userName"],
      order: [["userName", "ASC"]],
    });

    res.status(200).json({
      success: true,
      message: "Chat fetched successfully!",
      data: members,
    });
  } catch (err) {
    res.status(500).send({
      success: false,
      message: err.message,
    });
  }
};