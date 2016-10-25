'use strict';

module.exports = function(sequelize, DataTypes) {
    const Message = sequelize.define('Message', {
        text: { type: DataTypes.STRING }
    }, {
        tableName: 'chat_messages',
        timestamps: true,
        createdAt: 'timestamp',
        updatedAt: false,
        classMethods: {
            associate: function(models) {
                Message.belongsTo(models.Chat, { foreignKey: 'chat_id' });
                Message.belongsTo(models.User, { foreignKey: 'user_id' });
            },
            getLatest: function(chatId, timestamp) {
                return Message.findAll({
                    where: {
                        chat_id: chatId,
                        timestamp: {
                            $gt: new Date(timestamp)
                        }
                    },
                    include: [ { model: sequelize.models.User, attributes: ['firstName'] }]
                });
            }
        }
    });

    return Message;
};