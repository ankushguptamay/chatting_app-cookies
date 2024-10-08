import fs from "fs";
import { userSocketIDs } from "../index.js";

export const getOtherMember = (members, userId) => {
  const newMembers = [];
  for (let i = 0; i < members.length; i++) {
    if (members[i].userId !== userId) {
      newMembers.push(members[i]);
    }
  }
  return newMembers;
};

export const getSingleChat = (chat, userId) => {
  const otherMember = getOtherMember(chat.members, userId);
  const transForm = {
    id: chat.id,
    chatName: chat.isGroup ? chat.chatName : otherMember[0].userName,
    members: otherMember,
    isGroup: chat.isGroup,
    avatar_url: chat.isGroup ? chat.avatar_url : otherMember[0].avatar_url,
    creator: chat.creator,
  };
  return transForm;
};

export const deleteSingleFile = (filePath) => {
  if (filePath) {
    // console.log(fs.existsSync(filePath));
    if (fs.existsSync(filePath)) {
      fs.unlink(filePath, (err) => {
        if (err) {
          throw err;
        }
      });
    }
  }
  return;
};

export class ErrorHandler extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
  }
}

export const getSockets = (users = []) => {
  const sockets = users.map((user) => userSocketIDs.get(user.toString()));
  return sockets;
};
