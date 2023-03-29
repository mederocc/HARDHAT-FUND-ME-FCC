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

  describe("withdraw", async function () {
    beforeEach(async function () {
      await fundMe.fund({ value: sendValue });
    });
    it("Can withdraw ETH from a single founder", async function () {
      // Arrange
      const startingFundMeBalance = await fundMe.provider.getBalance(
        fundMe.address
      );

      const startingDeployerBalance = await fundMe.provider.getBalance(
        deployer
      );

      // Act
      const transactionResponse = await fundMe.withdraw();
      const transactionReceipt = await transactionResponse.wait(1);

      const { gasUsed, effectiveGasPrice } = transactionReceipt;
      const gasCost = gasUsed.mul(effectiveGasPrice); // they're big numbers, so we use .mul method to multiply them

      const endingFundMeBalance = await fundMe.provider.getBalance(
        fundMe.address
      );
      const endingDeployerBalance = await fundMe.provider.getBalance(deployer);

      // Assert
      assert.equal(endingFundMeBalance, 0);

      // assert.equal(
      //   startingDeployerBalance + startingFundMeBalance,
      //   endingDeployerBalance
      // );

      // We'll use the big number add method instead of the above code
      assert.equal(
        startingDeployerBalance.add(startingFundMeBalance).toString(),
        endingDeployerBalance.add(gasCost).toString()
      );
    });

    // this test is overloaded. Ideally we'd split it into multiple tests
    // but for simplicity we left it as one
    it("it allows us to withdraw with multiple funders", async () => {
      // Arrange
      const accounts = await ethers.getSigners();
      // start at 1 since 0 would be the owner
      for (i = 1; i < 6; i++) {
        const fundMeConnectedContract = await fundMe.connect(accounts[i]);
        await fundMeConnectedContract.fund({ value: sendValue });
      }
      const startingFundMeBalance = await fundMe.provider.getBalance(
        fundMe.address
      );
      const startingDeployerBalance = await fundMe.provider.getBalance(
        deployer
      );

      // Act
      const transactionResponse = await fundMe.withdraw();

      const transactionReceipt = await transactionResponse.wait();
      const { gasUsed, effectiveGasPrice } = transactionReceipt;
      const gasCost = gasUsed.mul(effectiveGasPrice);
      const endingFundMeBalance = await fundMe.provider.getBalance(
        fundMe.address
      );
      const endingDeployerBalance = await fundMe.provider.getBalance(deployer);

      // Assert
      assert.equal(endingFundMeBalance, 0);
      assert.equal(
        startingDeployerBalance.add(startingFundMeBalance).toString(),
        endingDeployerBalance.add(gasCost).toString()
      );
      // Make sure the funders are reset properly
      await expect(fundMe.funders(0)).to.be.reverted;

      for (i = 1; i < 6; i++) {
        assert.equal(
          await fundMe.getAddressToAmountFunded(accounts[i].address),
          0
        );
      }
    });

    it("Only allows the owner to withdraw", async function () {
      const accounts = await ethers.getSigners();
      const fundMeConnectedContract = await fundMe.connect(accounts[1]);
      await expect(fundMeConnectedContract.withdraw()).to.be.reverted;
    });
  });
});
