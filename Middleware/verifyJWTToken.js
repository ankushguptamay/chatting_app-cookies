import dotenv from "dotenv";
dotenv.config();

import jwt from "jsonwebtoken";
import db from "../Model/index.js";
const User = db.user;
import { ErrorHandler } from "../Utils/helper.js";
const { USER_JWT_SECRET_KEY, ADMIN_JWT_SECRET_KEY } = process.env;

export const verifyUserJWT = (req, res, next) => {
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

export const verifyAdminJWT = (req, res, next) => {
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

export const socketAuthenticator = async (err, socket, next) => {
  try {
    if (err) return next(err);

    const authToken = socket.request.cookies["chat-user-token"];

    if (!authToken)
      return next(new ErrorHandler("Please login to access this route", 401));

    const decodedData = jwt.verify(authToken, process.env.USER_JWT_SECRET_KEY);

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
