const db = require("../Model");
const { validateUser, userLogin } = require("../Middleware/validation");
const User = db.user;
const Chat = db.chat;
const Chat_User = db.chats_user;
const Request = db.request;
const { USER_JWT_SECRET_KEY, JWT_VALIDITY } = process.env;
const { deleteSingleFile } = require("../Utils/helper");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { Op } = require("sequelize");
const SALT = 10;

exports.register = async (req, res) => {
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
    // generate JWT Token
    const authToken = jwt.sign(
      {
        id: user.id,
        email: req.body.email,
      },
      USER_JWT_SECRET_KEY,
      { expiresIn: JWT_VALIDITY } // five day
    );
    // Send final success response
    res.status(200).send({
      success: true,
      message: "Registered successfully!",
      data: {
        authToken: authToken,
        fullName: req.body.fullName,
        email: req.body.email,
        mobileNumber: req.body.mobileNumber,
        id: user.id,
      },
    });
  } catch (err) {
    res.status(500).send({
      success: false,
      message: err.message,
    });
  }
};

exports.login = async (req, res) => {
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
    // generate JWT Token
    const authToken = jwt.sign(
      {
        id: user.id,
        email: req.body.email,
      },
      USER_JWT_SECRET_KEY,
      { expiresIn: JWT_VALIDITY } // five day
    );
    // Send final success response
    res.status(200).send({
      success: true,
      message: "Loged in successfully!",
      data: {
        authToken: authToken,
        fullName: user.fullName,
        email: req.body.email,
        mobileNumber: user.mobileNumber,
        id: user.id,
      },
    });
  } catch (err) {
    res.status(500).send({
      success: false,
      message: err.message,
    });
  }
};

exports.getMe = async (req, res) => {
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
      message: "My details successfully!",
      data: user,
    });
  } catch (err) {
    res.status(500).send({
      success: false,
      message: err.message,
    });
  }
};

exports.searchUser = async (req, res) => {
  try {
    const { name } = req.body;
    let condition = {
      email: { [Op.ne]: req.user.email },
    };
    if (name) {
      condition = {
        ...condition,
        name: { [Op.startsWith]: name },
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

exports.addUpdateUserAvatar = async (req, res) => {
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
    if (avatar.avatar_url) {
      deleteSingleFile(avatar.avatar_url);
    }
    await avatar.update({
      ...avatar,
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

exports.deleteUserAvatar = async (req, res) => {
  try {
    const user = await User.findOne({ where: { id: req.user.id } });
    deleteSingleFile(user.avatar_url);
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

exports.getAlluser = async (req, res) => {
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
                { [Op.and]: [{ "sender.id": id }, { status: "Accepted" }] },
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
