pragma solidity ^0.5.0;

contract Marketplace {
    string public name;
    uint public productCount = 0;
    mapping (uint => Product) public products;

    struct Product {
        uint id;
        string name; 
        uint price;
        address payable owner;
        bool purchased;
    }

    //Event for product creation
    event ProductCreated(
        uint id,
        string name,
        uint price,
        address payable owner,
        bool purchased
    );


    //Event for product purchase
    event ProductPurchased(
        uint id,
        string name,
        uint price,
        address payable owner,
        bool purchased
    );

    constructor() public {
        name = "This is a marketplace"; 
    }

    function createProduct(string memory _name, uint _price) public {
        require(bytes(_name).length > 0);//Require a valid name parameter
        require(_price > 0);
        productCount++;//incrementing the counter variable
        products[productCount] = Product(productCount, _name, _price, msg.sender, false);//Creating product and adding to the mapping.
        emit ProductCreated(productCount, _name, _price, msg.sender, false);//Trigger the event
    }

    function purchaseProduct(uint _id) public payable {
        Product memory _product = products[_id]; //Fetch the product
        address payable _seller = _product.owner; //Fetch the owner
        require(_product.id > 0 && _product.id <= productCount);//Product id is valid
        require(msg.value >= _product.price);// Check if there is enpugh ether in the transaction
        require(!_product.purchased);//Product purchased
        require(_seller != msg.sender);
        _product.owner = msg.sender;//Transfer ownership
        _product.purchased = true;//Mark as purchased
        products[_id] = _product;//Update the products mapping
        address(_seller).transfer(msg.value);//Transfers ether from buyer to seller
        emit ProductCreated(productCount, _product.name, _product.price, msg.sender, true);//Trigger an event
    }
}