import dotenv from "dotenv";
dotenv.config();

import jwt from "jsonwebtoken";
import db from "../Model/index.js";
const User = db.user;
import { ErrorHandler } from "../Utils/helper.js";
const { USER_JWT_SECRET_KEY, ADMIN_JWT_SECRET_KEY } = process.env;

export const verifyUserJWT = (req, res, next) => {
  const authHeader = req.headers.authorization || req.headers.Authorization;
  // console.log('JWT Verif MW');
  if (!authHeader?.startsWith("Bearer ")) return res.sendStatus(401);
  const token = authHeader.split(" ")[1];
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
  const authHeader = req.headers.authorization || req.headers.Authorization;
  // console.log('JWT Verif MW');
  if (!authHeader?.startsWith("Bearer ")) return res.sendStatus(401);
  const token = authHeader.split(" ")[1];

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

export const socketAuthenticator = async (socket, next) => {
  try {
    const token =
      socket.handshake.auth.token || socket.handshake.headers["authorization"];
    if (!token) {
      return next(new Error("Authentication error: Token not provided"));
    }

    // Verify the JWT token
    const decoded = jwt.verify(token, process.env.USER_JWT_SECRET_KEY);
    const user = await User.findOne({ where: { id: decoded.id } });

    if (!user)
      return next(new ErrorHandler("Please login to access this route", 401));
    socket.user = user;

    return next();
  } catch (err) {
    return next(new Error("Authentication error: Invalid token"));
  }
};
