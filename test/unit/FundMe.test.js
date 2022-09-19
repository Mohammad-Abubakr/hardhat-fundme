const { assert, expect } = require("chai")
const { deployments, ethers, getNamedAccounts, network } = require("hardhat")
const { etherscan } = require("../../hardhat.config")
describe("FundMe", () => {
  let fundMe
  let deployer
  let mockV3Aggregator
  const sendValue = ethers.utils.parseEther("1")
  beforeEach(async () => {
    deployer = (await getNamedAccounts()).deployer
    await deployments.fixture(["all"])
    fundMe = await ethers.getContract("FundMe", deployer)
    mockV3Aggregator = await ethers.getContract("MockV3Aggregator", deployer)
  })
  describe("constructor", () => {
    it("should have the same pricefeed address", async () => {
      const response = await Fundme.priceFeed()
      assert.equal(response, mockV3Aggregator.address)
    })
  })
  describe("fund", () => {
    it("should fail if enough ETH is not sent", async () => {
      await expect(Fundme.fund()).to.be.revertedWith(
        "You need to spend more ETH!"
      )
    })

    it("update the amount funded in correct data structure", async () => {
      await Fundme.fund({ value: sendValue })
      const response = await Fundme.addressToAmountFunded(deployer)
      assert.equal(response.toString(), sendValue.toString())
    })

    it("adds the funder to the funders array", async () => {
      await Fundme.fund({ value: sendValue })
      const response = await Fundme.funders(0)
      assert.equal(response, deployer)
    })
  })

  describe("withdrawal", () => {
    beforeEach(async () => {
      fundMe.fund({ value: sendValue })
    })
    it("withdraws ETH from a single funder", async () => {
      // Arrange
      const startingFundMeBalance = await fundMe.provider.getBalance(
        fundMe.address
      )
      const startingDeployerBalance = await fundMe.provider.getBalance(deployer)

      // Act
      const transactionResponse = await fundMe.withdraw()
      const transactionReceipt = await transactionResponse.wait()
      const { gasUsed, effectiveGasPrice } = transactionReceipt
      const gasCost = gasUsed.mul(effectiveGasPrice)

      const endingFundMeBalance = await fundMe.provider.getBalance(
        fundMe.address
      )
      const endingDeployerBalance = await fundMe.provider.getBalance(deployer)

      // Assert
      // Maybe clean up to understand the testing
      assert.equal(endingFundMeBalance, 0)
      assert.equal(
        startingFundMeBalance.add(startingDeployerBalance).toString(),
        endingDeployerBalance.add(gasCost).toString()
      )
    })
    it("is allows us to withdraw with multiple funders", async () => {
      const accounts = await ethers.getSigners()
      for (i = 1; i < 6; i++) {
        const fundMeConnectedContract = await fundMe.connect(accounts[i])
        await fundMeConnectedContract.fund({ value: sendValue })
      }
      const startingFundMeBalance = await fundMe.provider.getBalance(
        fundMe.address
      )
      const startingDeployerBalance = await fundMe.provider.getBalance(deployer)
      const transactionResponse = await fundMe.withdraw()
      const transactionReceipt = await transactionResponse.wait()
      const { gasUsed, effectiveGasPrice } = transactionReceipt
      const withdrawGasCost = gasUsed.mul(effectiveGasPrice)
      console.log(`GasCost: ${withdrawGasCost}`)
      console.log(`GasUsed: ${gasUsed}`)
      console.log(`GasPrice: ${effectiveGasPrice}`)
      const endingFundMeBalance = await fundMe.provider.getBalance(
        fundMe.address
      )
      const endingDeployerBalance = await fundMe.provider.getBalance(deployer)
      assert.equal(
        startingFundMeBalance.add(startingDeployerBalance).toString(),
        endingDeployerBalance.add(withdrawGasCost).toString()
      )
      await expect(fundMe.funders(0)).to.be.reverted

      for (i = 1; i < 6; i++) {
        assert.equal(await fundMe.addressToAmountFunded(accounts[i].address), 0)
      }
    })
  })

  it("only allows owner to withdraw", async () => {
    const accounts = await ethers.getSigners()
    const attackerConnectedcontract = await fundMe.connect(accounts[1])
    await expect(attackerConnectedcontract.withdraw()).to.be.reverted
  })
})
