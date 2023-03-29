const { deployments, ethers, getNamedAccounts } = require("hardhat");
const { assert, expect } = require("chai"); // chai is being overwrriten by waffle so we can use expect to test tests reverting

describe("FundMe", async function () {
  let fundMe;
  let deployer;
  let mockV3Aggregator;
  const sendValue = ethers.utils.parseEther("1"); // sets sendValue to 1e18, which is 1ETH
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

  describe("fund", async function () {
    it("Should fail if you don't send enough ETH", async function () {
      // waffle testing allows us to test whether transactions revert or fail, without simply having the test crash
      // which is why we won't be using assert
      await expect(fundMe.fund()).to.be.revertedWith(
        "You need to spend more ETH!"
      ); // We can do to.be.reveted instead of revertedWith if we don't want to pass an error message
    });
    it("Should update the amount funded data structure", async function () {
      await fundMe.fund({ value: sendValue });
      const response = await fundMe.addressToAmountFunded(deployer);
      assert.equal(response.toString(), sendValue.toString());
    });
    it("Adds funder to array of funders", async function () {
      await fundMe.fund({ value: sendValue });
      const funder = await fundMe.funders(0);
      assert.equal(funder, deployer);
    });
  });
});
