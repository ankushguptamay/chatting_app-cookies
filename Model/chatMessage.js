module.exports = (sequelize, DataTypes) => {
    const Message = sequelize.define("messages", {
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
        message: {
            type: DataTypes.STRING
        },
        senderId: {
            type: DataTypes.STRING
        },
        isViewed: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        }
    });
    return Message;
};