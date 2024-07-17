const db = require("../Model");
const {
  createMessage,
  createPrivateChat,
  createGroupChat,
  addMembers,
} = require("../Middleware/validation");
const User = db.user;
const Chat = db.chat;
const Chat_User = db.chats_user;
const Message = db.chatMessage;
const MessageAttachment = db.messageAttachment;
const {
  ALERT,
  NEW_ATTACHMENT,
  NEW_MESSAGE_ALERT,
  FETCHED_CHAT,
} = require("../Utils/event");
const { getOtherMember, getSingleChat } = require("../Utils/helper");
const { Op } = require("sequelize");

exports.createGroupChat = async (req, res) => {
  try {
    // Validate Body
    const { error } = createGroupChat(req.body);
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

exports.getUserChat = async (req, res) => {
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

exports.findChat = async (req, res) => {
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
        },
      ],
    });
    const transForm = getSingleChat(chat, req.user.id);
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

// Admin can add
exports.addMembers = async (req, res) => {
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
        }
      }
    }
    // Socket Event Will Fire to all members
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
exports.removeMembers = async (req, res) => {
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
exports.addAdmins = async (req, res) => {
  try {
    // Validate Body
    const { error } = addMembers(req.body);
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
exports.removeAdmins = async (req, res) => {
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

exports.createMessage = async (req, res) => {
  try {
    const files = req.files;
    if (files?.length < 1) {
      return res.status(400).json({
        success: false,
        message: "Select at least one file!",
      });
    }
    // Validate Body
    const { error } = createMessage(req.body);
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
        const attachment = await MessageAttachment.create({
          attachment_url: files[i].path,
          attachmentName: files[i].filename,
          messageId: chat.id,
        });
        attachments.push(attachment);
      }
    }
    chat = {
      ...chat.dataValues,
      attachments: attachments,
    };
    // Socket Event Will Fire to all members to send message;
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

exports.getMessage = async (req, res) => {
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

exports.leaveGroup = async (req, res) => {
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

exports.deleteGroup = async (req, res) => {
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
    await Chat_User.destroy({
      where: {
        chatId: chat.id,
      },
    });
    // Socket Event Will Fire to all members
    await chat.destroy();
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

exports.addUpdateGroupAvatar = async (req, res) => {
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
      deleteSingleFile(chat.avatar_url);
    }
    // Socket Event Will Fire to all members
    await chat.update({
      avatar_url: req.file.path,
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

exports.deleteGroupAvatar = async (req, res) => {
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
      deleteSingleFile(chat.avatar_url);
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
