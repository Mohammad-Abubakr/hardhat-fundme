const { assert } = require("chai")
const { getNamedAccounts, ethers, network, log } = require("hardhat")
const { developmentChains } = require("../../helper-hardhat-config")

developmentChains.includes(network.name)
  ? describe.skip
  : describe("Fundme", () => {
      let fundMe
      let deployer
      const sendValue = ethers.utils.parseEther("1")
      beforeEach(async function () {
        deployer = await getNamedAccounts().deployer
        fundMe = await ethers.getContract("FundMe", deployer)
      })

      it("allows to fund and withdraw the money", async () => {
        fundMe.fund({ value: sendValue })
        fundMe.withdraw()
        const endingBalance = await fundMe.provider.getBalance(fundMe.address)

        assert.equal(endingBalance.toString(), 0)
      })
    })
