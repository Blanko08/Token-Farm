const DaiToken = artifacts.require('./DaiToken.sol');
const DappToken = artifacts.require('./DappToken.sol');
const TokenFarm = artifacts.require('./TokenFarm.sol');

require('chai')
  .use(require('chai-as-promised'))
  .should()

function tokens(n) {
    return web3.utils.toWei(n, 'Ether');
}

contract('TokenFarm', ([owner, investor]) => {
  let daiToken, dappToken, tokenFarm;

  before(async () => {
    // Load Contracts
    daiToken = await DaiToken.new();
    dappToken = await DappToken.new();
    tokenFarm = await TokenFarm.new(dappToken.address, daiToken.address);
  
    // Transfer all Dapp Tokens to TokenFarm
    await dappToken.transfer(tokenFarm.address, tokens('1000000'));

    // Transfer 100 Mock DAI Tokens to investor
    await daiToken.transfer(investor, tokens('100'), { from: owner });
  });

  describe('Mock Dai Deployment', async () => {
    it('Has a name', async () => {
      const name = await daiToken.name();
      assert.equal(name, 'Mock DAI Token');
    });
  });

  describe('Dapp Token Deployment', async () => {
    it('Has a name', async () => {
      const name = await dappToken.name();
      assert.equal(name, 'DApp Token');
    });
  });

  describe('Token Farm Deployment', async () => {
    it('Has a name', async () => {
      const name = await tokenFarm.name();
      assert.equal(name, 'Dapp Token Farm');
    });

    it('Contract has tokens', async () => {
        let balance = await dappToken.balanceOf(tokenFarm.address);
        assert.equal(balance.toString(), tokens('1000000'));
      });
  });

  describe('Farming Tokens', async () => {
    it('Rewards investors for staking mDai Tokens', async () => {
        let result;

        // Check investor balance before staking
        result = await daiToken.balanceOf(investor);
        assert.equal(result.toString(), tokens('100'), 'Investor Mock DAI wallet balance should be correct before staking');

        // Stake Mock DAI Tokens
        await daiToken.approve(tokenFarm.address, tokens('100'), { from: investor });
        await tokenFarm.stakeTokens(tokens('100'), { from: investor });

        // Comprobar el balance del inversor después del staking.
        result = await daiToken.balanceOf(investor);
        assert.equal(result.toString(), tokens('0'), 'Investor Mock DAI wallet balance should be correct after staking');

        // Comprobar el balance de la DApp después del staking.
        result = await daiToken.balanceOf(tokenFarm.address);
        assert.equal(result.toString(), tokens('100'), 'Token Farm Mock DAI wallet balance should be correct after staking');

        // Comprobar el balance del inversor en la DApp después del staking.
        result = await tokenFarm.stakingBalance(investor);
        assert.equal(result.toString(), tokens('100'), 'Investor staking balance should be correct after staking');

        // Comprobar que el inversor está haciendo staking en la DApp.
        result = await tokenFarm.isStaking(investor);
        assert.equal(result.toString(), 'true', 'Investor staking status should be correct after staking');

        // Repartir los Tokens
        await tokenFarm.issueToken({ from: owner });

        // Comprueba los balances después del reparto.
        result = await dappToken.balanceOf(investor);
        assert.equal(result.toString(), tokens('100'), 'Investor DApp Token wallet balance should be correct after issuance');

        // Asegurarse de que solo el dueño puede repartir los tokens.
        await tokenFarm.issueToken({ from: investor }).should.be.rejected;

        // Unstake Tokens
        await tokenFarm.unstakeTokens({ from: investor });
        
        // Comprobar el resultado después de hacer el unstake.
        result = await daiToken.balanceOf(investor);
        assert.equal(result.toString(), tokens('100'), 'Investor Mock DAI wallet balance should be correct after unstaking');

        result = await daiToken.balanceOf(tokenFarm.address);
        assert.equal(result.toString(), tokens('0'), 'Token Farm Mock DAI wallet balance should be correct after unstaking');

        result = await tokenFarm.stakingBalance(investor);
        assert.equal(result.toString(), tokens('0'), 'Investor staking balance should be correct after unstaking');

        // Comprueba que el inversor ya no está haciendo staking después de hacer el unstake.
        result = await tokenFarm.isStaking(investor);
        assert.equal(result.toString(), 'false', 'Investor staking status should be correct after unstaking');
    });
  });

});