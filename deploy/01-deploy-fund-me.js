const { networkConfig } = require("../helper-hardhat-config")

modulde.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy, log } = deployments
  const { deployer } = await getNamedAccounts()
  const chainId = network.config.chainId
  const ethUsdPriceFeedAddress = networkConfig[chainId]["ethUsdPricefeed"]

  const FundMe = deploy("FundMe", {
    from: deployer,
    args: [],
    log: true,
  })
}
