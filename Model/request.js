const RequestSchema = (sequelize, DataTypes) => {
  const Request = sequelize.define("requests", {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    status: {
      type: DataTypes.STRING,
      validate: {
        isIn: [["Pending", "Accepted", "Rejected"]],
      },
      defaultValue: "Pending",
    },
    senderId: {
      type: DataTypes.STRING,
    },
    senderName: {
      type: DataTypes.STRING,
    },
    sender_avatar_url: {
      type: DataTypes.STRING(1234),
    },
    receiverId: {
      type: DataTypes.STRING,
    },
  });
  return Request;
};
export default RequestSchema ;
// sender: { id: id, avatar_url: avatar_url, userName: userName }