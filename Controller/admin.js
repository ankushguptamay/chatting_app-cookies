const db = require("../Model");
const Admin = db.admin;
const { userLogin, adminRegistration } = require("../Middleware/validation");
const { sendToken, cookieOptions } = require("../Utils/feature");
const bcrypt = require("bcryptjs");
const { Op } = require("sequelize");
const SALT = 10;

exports.register = async (req, res) => {
  try {
    const { error } = adminRegistration(req.body);
    if (error) {
      return res.status(400).send(error.details[0].message);
    }
    const isAdmin = await Admin.findOne({
      where: {
        email: req.body.email,
      },
    });
    if (isAdmin) {
      return res.status(400).send({
        success: false,
        message: "Admin already present!",
      });
    }
    const salt = await bcrypt.genSalt(SALT);
    const hashedPassword = await bcrypt.hash(req.body.password, salt);
    const admin = await Admin.create({
      ...req.body,
      password: hashedPassword,
    });
    sendToken(res, admin, 201, "Admin created", "chat-admin-token");
  } catch (err) {
    res.status(500).send({
      success: false,
      message: err.message,
    });
  }
};

exports.login = async (req, res) => {
  try {
    const { error } = userLogin(req.body);
    if (error) {
      // console.log(error);
      return res.status(400).send(error.details[0].message);
    }
    const admin = await Admin.findOne({
      where: {
        email: req.body.email,
      },
    });
    if (!admin) {
      return res.status(400).send({
        success: false,
        message: "Invalid email or password!",
      });
    }
    const validPassword = await bcrypt.compare(
      req.body.password,
      admin.password
    );
    if (!validPassword) {
      return res.status(400).send({
        success: false,
        message: "Invalid email or password!",
      });
    }
    sendToken(
      res,
      admin,
      200,
      `Welcome Back, ${admin.name}`,
      "chat-admin-token"
    );
  } catch (err) {
    res.status(500).send({
      success: false,
      message: err.message,
    });
  }
};

exports.logOut = async (req, res) => {
  try {
    return res
      .status(200)
      .cookie("chat-admin-token", "", { ...cookieOptions, maxAge: 0 })
      .json({
        success: true,
        message: "Logged out successfully",
      });
  } catch (err) {
    res.status(500).send({
      success: false,
      message: err.message,
    });
  }
};

exports.getAdmin = async (req, res) => {
  try {
    const admin = await Admin.findOne({
      where: {
        [Op.and]: [{ id: req.admin.id }, { email: req.admin.email }],
      },
    });
    res.status(200).send({
      success: true,
      message: "Admin Profile Fetched successfully!",
      data: admin,
    });
  } catch (err) {
    res.status(500).send({
      success: false,
      message: err.message,
    });
  }
};
