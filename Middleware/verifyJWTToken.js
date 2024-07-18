const jwt = require("jsonwebtoken");
const { USER_JWT_SECRET_KEY, ADMIN_JWT_SECRET_KEY } = process.env;

exports.verifyUserJWT = (req, res, next) => {
  const authHeader = req.headers.authorization || req.headers.Authorization;
  // console.log('JWT Verif MW');
  if (!authHeader?.startsWith("Bearer ")) return res.sendStatus(401);
  const token = authHeader.split(" ")[1];
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
  const authHeader = req.headers.authorization || req.headers.Authorization;
  // console.log('JWT Verif MW');
  if (!authHeader?.startsWith("Bearer ")) return res.sendStatus(401);
  const token = authHeader.split(" ")[1];
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
