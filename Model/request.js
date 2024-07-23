module.exports = (sequelize, DataTypes) => {
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
    sender: {
      type: DataTypes.JSON,
    },
    receiverId: {
      type: DataTypes.STRING,
    },
  });
  return Request;
};

// sender: { id: id, avatar_url: avatar_url, userName: userName }