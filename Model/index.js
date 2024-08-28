import dbConfig from "../Config/db.config.js";

import { Sequelize, DataTypes } from "sequelize";
const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.user,
  dbConfig.password,
  {
    host: dbConfig.host,
    dialect: dbConfig.dialect,
    pool: {
      max: dbConfig.pool.max,
      min: dbConfig.pool.min,
      acquire: dbConfig.pool.acquire,
      idle: dbConfig.pool.idle,
    },
  }
);

const db = {};
const queryInterface = sequelize.getQueryInterface();
db.Sequelize = Sequelize;
db.sequelize = sequelize;
db.DataTypes = DataTypes;

import AdminSchema from "./adminModel.js";
db.admin = AdminSchema(sequelize, Sequelize);
import UserSchema from "./user.js";
db.user = UserSchema(sequelize, Sequelize);
import RequestSchema from "./request.js";
db.request = RequestSchema(sequelize, Sequelize);
import ChatSchema from "./chat.js";
db.chat = ChatSchema(sequelize, Sequelize);
import ChatUserSchema from "./chats_user.js";
db.chats_user = ChatUserSchema(sequelize, Sequelize);
import MessageSchema from "./chatMessage.js";
db.chatMessage = MessageSchema(sequelize, Sequelize);
import MessageAttachSchema from "./messageAttachment.js";
db.messageAttachment = MessageAttachSchema(sequelize, Sequelize);

db.user.hasMany(db.chats_user, {
  foreignKey: "userId",
  as: "chats",
});

db.chat.hasMany(db.chats_user, {
  foreignKey: "chatId",
  as: "members",
});
db.chats_user.belongsTo(db.chat, {
  foreignKey: "chatId",
  as: "chats",
});

db.chat.hasMany(db.chatMessage, {
  foreignKey: "chatId",
  as: "messages",
});

db.chatMessage.hasMany(db.messageAttachment, {
  foreignKey: "messageId",
  as: "attachments",
});

queryInterface
  .addColumn("messageAttachments", "mimeType", {
    type: DataTypes.STRING,
  })
  .then((res) => {
    console.log("added!");
  })
  .catch((err) => {
    console.log(err);
  });

export default db;
