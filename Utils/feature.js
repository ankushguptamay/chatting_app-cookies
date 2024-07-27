const jwt = require("jsonwebtoken");
exports.cookieOptions = {
  maxAge: 15 * 24 * 60 * 60 * 1000,
  sameSite: "none",
  httpOnly: true,
  secure: true,
};

exports.sendToken = (res, user, code, message, tokenName) => {
  let token;
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

  return res.status(code).cookie(tokenName, token, this.cookieOptions).json({
    success: true,
    user,
    message,
  });
};
