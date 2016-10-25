'use strict';

module.exports = function(sequelize, DataTypes) {
    const Chat = sequelize.define('Chat', {
        active: { type: DataTypes.BOOLEAN, defaultValue: true }
    }, {
        tableName: 'chat_sessions',
        timestamps: true,
        createdAt: 'started_at',
        updatedAt: 'latest_update',
        classMethods: {
            associate: function(models) {
                Chat.belongsTo(models.User, { foreignKey: 'created_by' });
            }
        }
    });

    return Chat;
};