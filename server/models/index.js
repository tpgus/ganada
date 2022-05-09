"use strict";

const fs = require("fs");
const path = require("path");
const Sequelize = require("sequelize");
const basename = path.basename(__filename);
const env = process.env.NODE_ENV || "development";
const config = require(__dirname + "/../config/config.js")[env];
const db = {};

let sequelize;
if (config.use_env_variable) {
  sequelize = new Sequelize(process.env[config.use_env_variable], config);
} else {
  sequelize = new Sequelize(
    config.database,
    config.username,
    config.password,
    config
  );
}

fs.readdirSync(__dirname)
  .filter((file) => {
    return (
      file.indexOf(".") !== 0 && file !== basename && file.slice(-3) === ".js"
    );
  })
  .forEach((file) => {
    const model = require(path.join(__dirname, file))(
      sequelize,
      Sequelize.DataTypes
    );
    db[model.name] = model;
  });

Object.keys(db).forEach((modelName) => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

const { boards, chatcontents, chatrooms, user_chatroom, users } =
  sequelize.models;

// Many to Many
// user N : M chatrooms
users.belongsToMany(chatrooms, {
  through: "user_chatroom",
  foreignKey: "userId",
});
chatrooms.belongsToMany(users, {
  through: "user_chatroom",
  foreignKey: "chatroomId",
});

// One to Many

// users 1 : N boards
users.hasMany(boards, { foreignKey: "userId" });
boards.belongsTo(users, { foreignKey: "userId" });

// users 1 : N chatcontents
users.hasMany(chatcontents, { foreignKey: "userId" });
chatcontents.belongsTo(users, { foreignKey: "userId" });

// chatrooms 1: N chatcontents
chatrooms.hasMany(chatcontents, { foreignKey: "chatroomId" });
chatcontents.belongsTo(chatrooms, { foreignKey: "chatroomId" });

// boards 1 : N chatrooms
boards.hasMany(chatrooms, { foreignKey: "boardId" });
chatrooms.belongsTo(boards, { foreignKey: "boardId" });

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
