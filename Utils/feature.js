import dotenv from "dotenv";
dotenv.config();

import jwt from "jsonwebtoken";

export const sendAccessToken = (res, user, code, message, tokenName) => {
  let token;
  if (tokenName === "admin") {
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

  return res.status(code).json({
    success: true,
    AccessToken: token,
    user,
    message,
  });
};
