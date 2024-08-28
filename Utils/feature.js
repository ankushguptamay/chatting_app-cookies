import dotenv from "dotenv";
dotenv.config();

import jwt from "jsonwebtoken";
export const cookieOptions = {
  maxAge: 15 * 24 * 60 * 60 * 1000,
  sameSite: "none",
  httpOnly: true,
  secure: true,
};

export const sendToken = (res, user, code, message, tokenName) => {
  let token;
  console.log("here")
  if (tokenName === "chat-admin-token") {
    token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.ADMIN_JWT_SECRET_KEY
    );
  } else {
    token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.USER_JWT_SECRET_KEY
    );
  }

  return res.status(code).cookie(tokenName, token, cookieOptions).json({
    success: true,
    user,
    message,
  });
};
