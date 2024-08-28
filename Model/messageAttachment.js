const MessageAttachSchema = (sequelize, DataTypes) => {
  const MessageAttachment = sequelize.define("messageAttachments", {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    mimeType: {
      type: DataTypes.STRING,
    },
    attachment_url: {
      type: DataTypes.STRING(1234),
    },
    attachmentName: {
      type: DataTypes.STRING(1234),
    },
    attachment_public_id: {
      type: DataTypes.STRING,
    },
  });
  return MessageAttachment;
};

export default MessageAttachSchema 