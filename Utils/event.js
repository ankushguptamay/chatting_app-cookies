exports.ALERT = "ALERT";
exports.REFETCH_CHATS = "REFETCH_CHATS";

exports.NEW_ATTACHMENT = "NEW_ATTACHMENT";
exports.NEW_MESSAGE_ALERT = "NEW_MESSAGE_ALERT";

exports.NEW_REQUEST = "NEW_REQUEST";
exports.NEW_MESSAGE = "NEW_MESSAGE";

exports.START_TYPING = "START_TYPING";
exports.STOP_TYPING = "STOP_TYPING";

exports.CHAT_JOINED = "CHAT_JOINED";
exports.CHAT_LEAVED = "CHAT_LEAVED";

exports.ONLINE_USERS = "ONLINE_USERS";

exports.emitEvent = (req, events, user, data) => {
    console.log("Event Emited", events);
  };
