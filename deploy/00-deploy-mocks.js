const { network } = require('hardhat')
const {
  developmentChains,
  DECIMALS,
  INITIAL_ANSWER,
} = require('../helper-hardhat-config')

module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy, log } = deployments
  const { deployer } = await getNamedAccounts()

  if (developmentChains.includes(network.name)) {
    log('local network detected! Deploying mocks...')
    await deploy('MockV3Aggregator', {
      contract: 'MockV3Aggregator',
      from: deployer,
      log: true,
      args: [DECIMALS, INITIAL_ANSWER], // passes the arguments the constructor expects at v0.6 MockV3Aggregator // https://github.com/smartcontractkit/chainlink/blob/develop/contracts/src/v0.6/tests/MockV3Aggregator.sol
    })
    log('Mocks deployed')
    log('----------------------------------------')
  }
}

module.exports.tags = ['all', 'mocks']
// npx hardhat deploy can flag --tag mocks
