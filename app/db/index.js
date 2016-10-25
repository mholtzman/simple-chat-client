'use strict';

const fs = require('fs'),
    path = require('path'),
    Sequelize = require('sequelize'),
    config = require('../config');

console.log('initializing db: ' + JSON.stringify(config.db, undefined, 1));

const connection = new Sequelize(
    config.db.database, 
    config.db.user, 
    config.db.password, {
        host: config.db.host || '127.0.0.1',
        dialect: config.db.dialect || 'sqlite',
        storage: config.db.storage || './local-db-data.sqlite',
        logging: (config.db.showSQL && console.log) || false,
    });

let db = {};

fs.readdirSync(__dirname)
    .filter(function(file) {
        // exclude this file
        return file !== "index.js";
    })
    .forEach(file => {
        const model = connection.import(path.join(__dirname, file));
        db[model.name] = model;
    });

Object.keys(db).forEach(modelName => {
    if ('associate' in db[modelName]) {
        db[modelName].associate(db);
    }
});

db.sequelize = connection;
db.Sequelize = Sequelize;

module.exports = db;