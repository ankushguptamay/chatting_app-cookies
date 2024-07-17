exports.ALERT = "ALERT";
exports.FETCHED_CHAT = "FETCHED_CHAT";
exports.NEW_ATTACHMENT = "NEW_ATTACHMENT";
exports.NEW_MESSAGE_ALERT = "NEW_MESSAGE_ALERT";
exports.NEW_REQUEST = "NEW_REQUEST";
exports.REFETCH_CHATS = "REFETCH_CHATS";

exports.emitEvent = (req, events, user, data) => {
  console.log("Event Emited", events);
};
