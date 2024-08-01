const jwt = require("jsonwebtoken");
const db = require("../Model");
const User = db.user;
const { USER_JWT_SECRET_KEY, ADMIN_JWT_SECRET_KEY } = process.env;

exports.verifyUserJWT = (req, res, next) => {
  const token = req.cookies["chat-user-token"];

  if (!token) return res.sendStatus(401);

  jwt.verify(token, USER_JWT_SECRET_KEY, (err, decoded) => {
    if (err) {
      return res.status(401).send({
        success: false,
        message: "Unauthorized!",
      });
    }
    req.user = decoded;
    return next();
  });
};

exports.verifyAdminJWT = (req, res, next) => {
  const token = req.cookies["chat-admin-token"];

  if (!token) return res.sendStatus(401);

  jwt.verify(token, ADMIN_JWT_SECRET_KEY, (err, decoded) => {
    if (err) {
      return res.status(401).send({
        success: false,
        message: "Unauthorized!",
      });
    }
    req.admin = decoded;
    return next();
  });
};

exports.socketAuthenticator = async (err, socket, next) => {
  try {
    if (err) return next(err);

    const authToken = socket.request.cookies["chat-user-token"];

    if (!authToken)
      return res
        .status(401)
        .send({ success: false, message: "Please login to access this route" });

    const decodedData = jwt.verify(authToken, process.env.USER_JWT_SECRET_KEY);

    const user = await User.findOne({ where: { id: decodedData.id } });

    if (!user)
      return res.status(401).send({
        success: false,
        message: "Please Rejister to access this route",
      });

    socket.user = user;

    return next();
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      success: false,
      message: error,
    });
  }
};
