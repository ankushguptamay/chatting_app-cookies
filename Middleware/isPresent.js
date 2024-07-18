const db = require("../Model");
const User = db.user;
const Admin = db.admin;
const { Op } = require("sequelize");

exports.isUserPresent = async (req, res, next) => {
  try {
    const user = await User.findOne({
      where: {
        [Op.and]: [{ id: req.user.id }, { email: req.user.email }],
      },
    });
    if (!user) {
      return res.send({
        message: "user is not present! Are you register?.. ",
      });
    }
    req.user = {
      ...req.user,
      avatar_url: user.avatar_url,
      userName: user.fullName,
    };
    next();
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

exports.isAdminPresent = async (req, res, next) => {
  try {
    const admin = await Admin.findOne({
      where: {
        [Op.and]: [{ id: req.admin.id }, { email: req.admin.email }],
      },
    });
    if (!admin) {
      return res.send({
        message: "admin is not present! Are you register?.. ",
      });
    }
    next();
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};
