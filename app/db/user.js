'use strict';

module.exports = function(sequelize, DataTypes) {
    const User = sequelize.define('User', {
        email: { type: DataTypes.STRING, unique: true, validate: { isEmail: true } },
        firstName: { type: DataTypes.STRING, field: 'first_name' },
        lastName: { type: DataTypes.STRING, field: 'last_name' }
    }, {
        tableName: 'users',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        getterMethods: {
            isRep: function() {
                return this.role_id == 1;
            }
        },
        classMethods: {
            associate: function(models) {
                User.belongsTo(models.Role, { foreignKey: 'role_id' });
            }
        }
    });

    return User;
};