import dotenv from "dotenv";
dotenv.config();

import db from "../Model/index.js";
import { validateUser, userLogin } from "../Middleware/validation.js";
const User = db.user;
const Chat = db.chat;
const Message = db.chatMessage;
const Chat_User = db.chats_user;
const Request = db.request;
import { deleteSingleFile } from "../Utils/helper.js";
import bcrypt from "bcryptjs";
import { Op } from "sequelize";
import { sendAccessToken } from "../Utils/feature.js";
import { uploadFileToBunny, deleteFileToBunny } from "../Utils/bunny.js";
import fs from "fs";
const bunnyFolderName = "attachment";
const SALT = 10;

export const register = async (req, res) => {
  try {
    // Validate Body
    const { error } = validateUser(req.body);
    if (error) {
      return res.status(400).send(error.details[0].message);
    }
    // If Email is already present
    const isUser = await User.findOne({
      where: {
        email: req.body.email,
      },
    });
    if (isUser) {
      return res.status(400).send({
        success: false,
        message: "User already present!",
      });
    }
    // Hash password
    const salt = await bcrypt.genSalt(SALT);
    const hashedPassword = await bcrypt.hash(req.body.password, salt);
    // Create USer in database
    const user = await User.create({
      ...req.body,
      password: hashedPassword,
    });
    // Send final success response
    sendAccessToken(res, user, 201, "User created", "user");
  } catch (err) {
    res.status(500).send({
      success: false,
      message: err.message,
    });
  }
};

export const login = async (req, res) => {
  try {
    // Validate Body
    const { error } = userLogin(req.body);
    if (error) {
      console.log(error);
      return res.status(400).send(error.details[0].message);
    }
    // If Email is already present
    const user = await User.findOne({
      where: {
        email: req.body.email,
      },
    });
    if (!user) {
      return res.status(400).send({
        success: false,
        message: "Invalid email or password!",
      });
    }
    // console.log("Here")
    // Compare password with hashed password
    const validPassword = await bcrypt.compare(
      req.body.password,
      user.password
    );
    if (!validPassword) {
      return res.status(400).send({
        success: false,
        message: "Invalid email or password!",
      });
    }

    sendAccessToken(res, user, 200, `Welcome Back, ${user.fullName}`, "user");
  } catch (err) {
    res.status(500).send({
      success: false,
      message: err.message,
    });
  }
};

export const getMe = async (req, res) => {
  try {
    // If Email is already present
    const user = await User.findOne({
      where: {
        email: req.user.email,
        id: req.user.id,
      },
    });
    // Send final success response
    res.status(200).send({
      success: true,
      message: "My details fetched successfully!",
      data: user,
    });
  } catch (err) {
    res.status(500).send({
      success: false,
      message: err.message,
    });
  }
};

export const searchUser = async (req, res) => {
  try {
    const { name } = req.query;
    let condition = {
      email: { [Op.ne]: req.user.email },
    };
    if (name) {
      condition = {
        ...condition,
        fullName: { [Op.startsWith]: name },
      };
    }
    // If Email is already present
    const user = await User.findAll({
      limit: 10,
      where: condition,
    });
    // Send final success response
    res.status(200).send({
      success: true,
      message: "User fetched successfully!",
      data: user,
    });
  } catch (err) {
    res.status(500).send({
      success: false,
      message: err.message,
    });
  }
};

export const addUpdateUserAvatar = async (req, res) => {
  try {
    // File should be exist
    if (!req.file) {
      return res.status(400).send({
        success: false,
        message: "Please..upload an Avatar!",
      });
    }
    const avatar = await User.findOne({
      where: {
        id: req.user.id,
      },
    });
    //Upload file
    const fileStream = fs.createReadStream(req.file.path);
    await uploadFileToBunny(bunnyFolderName, fileStream, req.file.filename);
    deleteSingleFile(req.file.path);
    if (avatar.fileName) {
      await deleteFileToBunny(bunnyFolderName, avatar.fileName);
    }
    await Chat_User.update(
      {
        avatar_url: `${process.env.SHOW_BUNNY_FILE_HOSTNAME}/${bunnyFolderName}/${req.file.filename}`,
      },
      { where: { userId: req.user.id } }
    );
    await Message.update(
      {
        avatar_url: `${process.env.SHOW_BUNNY_FILE_HOSTNAME}/${bunnyFolderName}/${req.file.filename}`,
      },
      { where: { senderId: req.user.id } }
    );
    await Request.update(
      {
        sender_avatar_url: `${process.env.SHOW_BUNNY_FILE_HOSTNAME}/${bunnyFolderName}/${req.file.filename}`,
      },
      { where: { senderId: req.user.id } }
    );
    await avatar.update({
      ...avatar,
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

export const deleteUserAvatar = async (req, res) => {
  try {
    const user = await User.findOne({ where: { id: req.user.id } });
    await deleteFileToBunny(bunnyFolderName, user.fileName);
    await user.update({
      avatar_url: null,
      fileName: null,
    });
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

export const getAlluser = async (req, res) => {
  try {
    const user = await User.findAll({
      attributes: { exclude: ["password"] },
    });
    const transFormUser = await Promise.all(
      user.map(async ({ id, avatar_url, fullName, email }) => {
        const [groups, ownGroups, friends] = await Promise.all([
          Chat.count({
            where: { isGroup: true },
            include: [
              {
                model: Chat_User,
                as: "members",
                where: { userId: id },
                require: true,
              },
            ],
          }),
          Chat.count({
            where: { isGroup: true, creator: id },
          }),
          Request.count({
            where: {
              [Op.or]: [
                { [Op.and]: [{ senderId: id }, { status: "Accepted" }] },
                { [Op.and]: [{ status: "Accepted" }, { receiverId: id }] },
              ],
            },
          }),
        ]);
        return {
          fullName: fullName,
          email,
          id,
          avatar_url,
          groups,
          ownGroups,
          friends,
        };
      })
    );
    // Send final success response
    res.status(200).send({
      success: true,
      message: "User fetched successfully!",
      data: transFormUser,
    });
  } catch (err) {
    res.status(500).send({
      success: false,
      message: err.message,
    });
  }
};
