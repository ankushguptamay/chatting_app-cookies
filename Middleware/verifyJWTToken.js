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
        message: "Unauthorized!",
      });
    }
    req.user = decoded;
    next();
  });
};

exports.verifyAdminJWT = (req, res, next) => {
  const token = req.cookies["chat-admin-token"];
  if (!token) return res.sendStatus(401);
  jwt.verify(token, ADMIN_JWT_SECRET_KEY, (err, decoded) => {
    if (err) {
      return res.status(401).send({
        message: "Unauthorized!",
      });
    }
    req.admin = decoded;
    next();
  });
};

exports.socketAuthenticator = async (err, socket, next) => {
  try {
    if (err) return next(err);

    if (err) return next(err);

    const authToken = socket.request.cookies["chat-user-token"];

    if (!authToken)
      return next(new ErrorHandler("Please login to access this route", 401));

    const decodedData = jwt.verify(authHeader, process.env.USER_JWT_SECRET_KEY);

    const user = await User.findOne({ where: { id: decodedData.id } });

    if (!user)
      return next(new ErrorHandler("Please login to access this route", 401));

    socket.user = user;

    return next();
  } catch (error) {
    console.log(error);
    return next(new ErrorHandler("Please login to access this route", 401));
  }
};
