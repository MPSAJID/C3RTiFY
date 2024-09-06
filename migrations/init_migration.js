let Migrations = artifacts.require("./contracts/migrations.sol");

module.exports = function(deployer) {
  deployer.deploy(Migrations);
};