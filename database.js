const Sequelize = require('sequelize');
require('dotenv').config("./env")

const sequelize = new Sequelize("thesis", "postgres", "postgres", {
  host: "thesis.c41xgmauipnh.us-east-1.rds.amazonaws.com",
  dialect: 'postgres',
});

module.exports = sequelize;