const ChatSchema = (sequelize, DataTypes) => {
    const Chat = sequelize.define("chats", {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        isGroup: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        },
        chatName: {
            type: DataTypes.STRING
        },
        creator: {
            type: DataTypes.STRING
        },
        avatar_url: {
            type: DataTypes.STRING(1234)
        },
        fileName: {
            type: DataTypes.STRING(1234)
        },
        avatar_public_id: {
            type: DataTypes.STRING
        }
    });
    return Chat;
};

export default ChatSchema