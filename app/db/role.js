'use strict';

module.exports = function(sequelize, DataTypes) {
    const Role = sequelize.define('Role', {
        description: { type: DataTypes.STRING }
    }, {
        tableName: 'roles',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    });

    return Role;
};