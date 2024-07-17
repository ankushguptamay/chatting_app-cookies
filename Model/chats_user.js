module.exports = (sequelize, DataTypes) => {
    const Chat_User = sequelize.define("chats_users", {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        userName: {
            type: DataTypes.STRING
        },
        avatar_url: {
            type: DataTypes.STRING
        },
        isAdmin: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        }
    });

    return Chat_User;
};

// userId
// chatId