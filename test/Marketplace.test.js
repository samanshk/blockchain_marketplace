const Marketplace = artifacts.require('../src/contracts/Marketplace.sol');

require('chai').use(require('chai-as-promised')).should();

contract('Marketplace', ([deployer, seller, buyer]) => {
    let marketplace;  

    before(async () => {
        marketplace = await Marketplace.deployed();
    });

    describe('deployment', async () => {
        it('Deploys successfully', async () => {
            const address = await marketplace.address;
            assert.notEqual(address, 0x0); 
            assert.notEqual(address, ''); 
            assert.notEqual(address, null); 
            assert.notEqual(address, undefined); 
        });

        it('Has a name', async () => {
            const name = await marketplace.name();
            assert.equal(name, 'This is a marketplace');
        });
    });


    describe('products', async () => {
        let result, productCount
        before(async () => {
            result = await marketplace.createProduct('galaxy s10', web3.utils.toWei('1', 'Ether'), {from: seller});
            productCount = await marketplace.productCount();
        });

        it('creates products', async () => {
            //SUCCESS
            assert.equal(productCount, 1);
            const event = result.logs[0].args;
            assert.equal(event.id.toNumber(), productCount.toNumber(), 'id is correct');
            assert.equal(event.name, 'galaxy s10', 'name is correct');
            assert.equal(event.price, '1000000000000000000', 'price is correct');
            assert.equal(event.owner, seller, 'owner is correct');
            assert.equal(event.purchased, false, 'purchased is correct')

            //FALIURE: Should have a name
            await marketplace.createProduct('', web3.utils.toWei('1', 'Ether'), {from: seller}).should.be.rejected;
            //FALIURE: Should have a price
            await marketplace.createProduct('galaxy s10', 0, {from: seller}).should.be.rejected;

        });

        it('lists products', async () => {
            const product = await marketplace.products(productCount);
            assert.equal(product.id.toNumber(), productCount.toNumber(), 'id is correct');
            assert.equal(product.name, 'galaxy s10', 'name is correct');
            assert.equal(product.price, '1000000000000000000', 'price is correct');
            assert.equal(product.owner, seller, 'owner is correct');
            assert.equal(product.purchased, false, 'purchased is correct')
        });

        it('sells products', async () => {
            // Track the seller balance before purchase
            let sellerOldBalance;
            sellerOldBalance = await web3.eth.getBalance(seller);
            sellerOldBalance = new web3.utils.BN(sellerOldBalance);


            //Purchase SUCCESS
            result = await marketplace.purchaseProduct(productCount, {from: buyer, value: web3.utils.toWei('1', 'Ether')});

            //Check logs
            const event = result.logs[0].args;
            assert.equal(event.id.toNumber(), productCount.toNumber(), 'id is correct');
            assert.equal(event.name, 'galaxy s10', 'name is correct');
            assert.equal(event.price, '1000000000000000000', 'price is correct');
            assert.equal(event.owner, buyer, 'owner is correct');
            assert.equal(event.purchased, true, 'purchased is correct');

            // Track the seller balance after purchase
            let sellerNewBalance;
            sellerNewBalance = await web3.eth.getBalance(seller);
            sellerNewBalance = new web3.utils.BN(sellerNewBalance);

            let price;
            price = await web3.utils.toWei('1', 'Ether');
            price = new web3.utils.BN(price);

            const expectedBalance = sellerOldBalance.add(price);
            assert.equal(sellerNewBalance.toString(), expectedBalance.toString());


            
            // FALIURE: Tries to buy product that does not exist i.e. product should have a valid id.
            await marketplace.purchaseProduct(99, {from: buyer, value: web3.utils.toWei('1', 'Ether')}).should.be.rejected;
            // FALIURE: Trying to buy without enough ether
            await marketplace.purchaseProduct(productCount, {from: buyer, value: web3.utils.toWei('0.5', 'Ether')}).should.be.rejected;
            // FALIURE: Deployer tries to buy product / Tries to purchase product twice
            await marketplace.purchaseProduct(productCount, {from: deployer, value: web3.utils.toWei('1', 'Ether')}).should.be.rejected;
            // FALIURE: Buyer tries to buy product twice 
            await marketplace.purchaseProduct(productCount, {from: buyer, value: web3.utils.toWei('1', 'Ether')}).should.be.rejected;
        });
    });
});