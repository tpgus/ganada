"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class reviews extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      models.reviews.belongsTo(models.Users);
    }
  }
  reviews.init(
    {
      kind: DataTypes.INTEGER,
      time: DataTypes.INTEGER,
      again: DataTypes.INTEGER,
      userId: DataTypes.INTEGER,
    },
    {
      sequelize,
      modelName: "reviews",
    }
  );
  return reviews;
};
