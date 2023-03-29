const { deployments, ethers, getNamedAccounts } = require("hardhat");
const { assert } = require("chai");

describe("FundMe", async function () {
  let fundMe;
  let deployer;
  let mockV3Aggregator;
  beforeEach(async function () {
    //deploy fundme contract using hardhat-deploy
    deployer = (await getNamedAccounts()).deployer;
    await deployments.fixture("all"); // fixture allows us to run our entire deploy folder with as many tags as we want
    fundMe = await ethers.getContract("FundMe", deployer); // this will give us the most recently deployed FundMe contract
    mockV3Aggregator = await ethers.getContract("MockV3Aggregator", deployer);
  });
  describe("constructor", async function () {
    it("Sets the aggregator addresses correctly", async function () {
      const response = await fundMe.priceFeed();
      assert.equal(response, mockV3Aggregator.address);
    });
  });
});
