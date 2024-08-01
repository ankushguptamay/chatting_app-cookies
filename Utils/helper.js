const fs = require("fs");

const getOtherMember = (members, userId) => {
  const newMembers = [];
  for (let i = 0; i < members.length; i++) {
    if (members[i].userId !== userId) {
      newMembers.push(members[i]);
    }
  }
  return newMembers;
};

const getSingleChat = (chat, userId) => {
  const otherMember = this.getOtherMember(chat.members, userId);
  return (transForm = {
    id: chat.id,
    chatName: chat.isGroup ? chat.chatName : otherMember[0].userName,
    members: otherMember,
    isGroup: chat.isGroup,
    avatar_url: chat.isGroup ? chat.avatar_url : otherMember[0].avatar_url,
    creator: chat.creator,
  });
};

const deleteSingleFile = (filePath) => {
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

class ErrorHandler extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
  }
}

module.exports = {
  ErrorHandler,
  deleteSingleFile,
  getSingleChat,
  getOtherMember,
};
