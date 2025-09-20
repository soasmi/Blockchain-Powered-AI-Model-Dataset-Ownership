// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "./AIAssetNFT.sol";
import "./LicenseManager.sol";

contract Marketplace is Ownable, ReentrancyGuard, Pausable {
    
    // Marketplace fee (basis points, 250 = 2.5%)
    uint256 public marketplaceFee = 250;
    uint256 public constant MAX_FEE = 1000; // 10% max
    
    // Referenced contracts
    AIAssetNFT public aiAssetNFT;
    LicenseManager public licenseManager;
    
    // Order structure for auction/bidding
    struct Order {
        uint256 orderId;
        uint256 assetTokenId;
        address seller;
        address buyer;
        uint256 price;
        uint256 startTime;
        uint256 endTime;
        bool isActive;
        bool isAuction;
        uint256 highestBid;
        address highestBidder;
    }
    
    // Bid structure
    struct Bid {
        address bidder;
        uint256 amount;
        uint256 timestamp;
    }
    
    // Mappings
    mapping(uint256 => Order) public orders;
    mapping(uint256 => Bid[]) public orderBids;
    mapping(address => uint256[]) public userOrders;
    mapping(address => uint256[]) public userBids;
    
    // Counters
    uint256 private _orderIdCounter;
    
    // Events
    event OrderCreated(
        uint256 indexed orderId,
        uint256 indexed assetTokenId,
        address indexed seller,
        uint256 price,
        bool isAuction,
        uint256 endTime
    );
    
    event OrderCancelled(
        uint256 indexed orderId,
        address indexed seller
    );
    
    event OrderFilled(
        uint256 indexed orderId,
        address indexed buyer,
        uint256 price
    );
    
    event BidPlaced(
        uint256 indexed orderId,
        address indexed bidder,
        uint256 amount
    );
    
    event BidWithdrawn(
        uint256 indexed orderId,
        address indexed bidder,
        uint256 amount
    );
    
    event AuctionEnded(
        uint256 indexed orderId,
        address indexed winner,
        uint256 winningBid
    );
    
    event MarketplaceFeeUpdated(
        uint256 newFee
    );
    
    // Modifiers
    modifier onlyAssetOwner(uint256 assetTokenId) {
        require(aiAssetNFT.ownerOf(assetTokenId) == msg.sender, "Not the asset owner");
        _;
    }
    
    modifier validOrder(uint256 orderId) {
        require(orders[orderId].orderId != 0, "Order does not exist");
        _;
    }
    
    modifier activeOrder(uint256 orderId) {
        require(orders[orderId].isActive, "Order not active");
        require(block.timestamp <= orders[orderId].endTime, "Order expired");
        _;
    }
    
    constructor(address _aiAssetNFT, address _licenseManager) {
        aiAssetNFT = AIAssetNFT(_aiAssetNFT);
        licenseManager = LicenseManager(_licenseManager);
    }
    
    // Create a fixed price order
    function createFixedPriceOrder(
        uint256 assetTokenId,
        uint256 price
    ) external onlyAssetOwner(assetTokenId) whenNotPaused {
        require(price > 0, "Price must be greater than 0");
        
        uint256 orderId = _orderIdCounter;
        _orderIdCounter++;
        
        Order memory newOrder = Order({
            orderId: orderId,
            assetTokenId: assetTokenId,
            seller: msg.sender,
            buyer: address(0),
            price: price,
            startTime: block.timestamp,
            endTime: 0, // No end time for fixed price
            isActive: true,
            isAuction: false,
            highestBid: 0,
            highestBidder: address(0)
        });
        
        orders[orderId] = newOrder;
        userOrders[msg.sender].push(orderId);
        
        emit OrderCreated(orderId, assetTokenId, msg.sender, price, false, 0);
    }
    
    // Create an auction order
    function createAuctionOrder(
        uint256 assetTokenId,
        uint256 startingPrice,
        uint256 duration
    ) external onlyAssetOwner(assetTokenId) whenNotPaused {
        require(startingPrice > 0, "Starting price must be greater than 0");
        require(duration > 0, "Duration must be greater than 0");
        
        uint256 orderId = _orderIdCounter;
        _orderIdCounter++;
        
        Order memory newOrder = Order({
            orderId: orderId,
            assetTokenId: assetTokenId,
            seller: msg.sender,
            buyer: address(0),
            price: startingPrice,
            startTime: block.timestamp,
            endTime: block.timestamp + duration,
            isActive: true,
            isAuction: true,
            highestBid: 0,
            highestBidder: address(0)
        });
        
        orders[orderId] = newOrder;
        userOrders[msg.sender].push(orderId);
        
        emit OrderCreated(orderId, assetTokenId, msg.sender, startingPrice, true, block.timestamp + duration);
    }
    
    // Buy fixed price order
    function buyFixedPriceOrder(uint256 orderId) external payable validOrder(orderId) activeOrder(orderId) nonReentrant {
        Order storage order = orders[orderId];
        require(!order.isAuction, "This is an auction order");
        require(msg.value >= order.price, "Insufficient payment");
        require(order.seller != msg.sender, "Cannot buy own order");
        
        // Execute the sale
        _executeSale(orderId, msg.sender, order.price);
        
        emit OrderFilled(orderId, msg.sender, order.price);
    }
    
    // Place bid on auction
    function placeBid(uint256 orderId) external payable validOrder(orderId) activeOrder(orderId) nonReentrant {
        Order storage order = orders[orderId];
        require(order.isAuction, "This is not an auction order");
        require(msg.sender != order.seller, "Cannot bid on own auction");
        require(msg.value > order.highestBid, "Bid must be higher than current highest bid");
        require(msg.value >= order.price, "Bid must be at least the starting price");
        
        // Refund previous highest bidder
        if (order.highestBidder != address(0)) {
            payable(order.highestBidder).transfer(order.highestBid);
        }
        
        // Update order with new highest bid
        order.highestBid = msg.value;
        order.highestBidder = msg.sender;
        
        // Record bid
        Bid memory newBid = Bid({
            bidder: msg.sender,
            amount: msg.value,
            timestamp: block.timestamp
        });
        
        orderBids[orderId].push(newBid);
        userBids[msg.sender].push(orderId);
        
        emit BidPlaced(orderId, msg.sender, msg.value);
    }
    
    // Withdraw bid (only if not the highest bidder)
    function withdrawBid(uint256 orderId) external validOrder(orderId) nonReentrant {
        Order storage order = orders[orderId];
        require(order.isAuction, "This is not an auction order");
        require(order.highestBidder != msg.sender, "Cannot withdraw highest bid");
        
        // Find user's bid amount
        uint256 bidAmount = 0;
        for (uint256 i = 0; i < orderBids[orderId].length; i++) {
            if (orderBids[orderId][i].bidder == msg.sender) {
                bidAmount = orderBids[orderId][i].amount;
                break;
            }
        }
        
        require(bidAmount > 0, "No bid found");
        
        // Refund the bid
        payable(msg.sender).transfer(bidAmount);
        
        emit BidWithdrawn(orderId, msg.sender, bidAmount);
    }
    
    // End auction and execute sale
    function endAuction(uint256 orderId) external validOrder(orderId) nonReentrant {
        Order storage order = orders[orderId];
        require(order.isAuction, "This is not an auction order");
        require(block.timestamp >= order.endTime, "Auction not ended yet");
        require(order.isActive, "Auction already ended");
        require(order.highestBidder != address(0), "No bids placed");
        
        // Execute the sale
        _executeSale(orderId, order.highestBidder, order.highestBid);
        
        emit AuctionEnded(orderId, order.highestBidder, order.highestBid);
    }
    
    // Cancel order
    function cancelOrder(uint256 orderId) external validOrder(orderId) {
        Order storage order = orders[orderId];
        require(order.seller == msg.sender, "Not the order owner");
        require(order.isActive, "Order not active");
        require(order.buyer == address(0), "Order already sold");
        
        // If it's an auction with bids, refund the highest bidder
        if (order.isAuction && order.highestBidder != address(0)) {
            payable(order.highestBidder).transfer(order.highestBid);
        }
        
        order.isActive = false;
        
        emit OrderCancelled(orderId, msg.sender);
    }
    
    // Internal function to execute sale
    function _executeSale(uint256 orderId, address buyer, uint256 price) internal {
        Order storage order = orders[orderId];
        
        // Get asset details
        AIAssetNFT.Asset memory asset = aiAssetNFT.getAsset(order.assetTokenId);
        
        // Calculate fees
        uint256 marketplaceFeeAmount = (price * marketplaceFee) / 10000;
        uint256 royaltyAmount = (price * asset.royaltyPercentage) / 10000;
        uint256 sellerAmount = price - marketplaceFeeAmount - royaltyAmount;
        
        // Transfer asset ownership
        aiAssetNFT.transferFrom(order.seller, buyer, order.assetTokenId);
        
        // Update order
        order.buyer = buyer;
        order.isActive = false;
        
        // Transfer payments
        if (royaltyAmount > 0) {
            payable(asset.creator).transfer(royaltyAmount);
        }
        
        payable(order.seller).transfer(sellerAmount);
        
        // Marketplace fee goes to contract owner
        if (marketplaceFeeAmount > 0) {
            payable(owner()).transfer(marketplaceFeeAmount);
        }
    }
    
    // Get order details
    function getOrder(uint256 orderId) external view validOrder(orderId) returns (Order memory) {
        return orders[orderId];
    }
    
    // Get order bids
    function getOrderBids(uint256 orderId) external view validOrder(orderId) returns (Bid[] memory) {
        return orderBids[orderId];
    }
    
    // Get user's orders
    function getUserOrders(address user) external view returns (Order[] memory) {
        uint256[] memory orderIds = userOrders[user];
        Order[] memory userOrderList = new Order[](orderIds.length);
        
        for (uint256 i = 0; i < orderIds.length; i++) {
            userOrderList[i] = orders[orderIds[i]];
        }
        
        return userOrderList;
    }
    
    // Get user's bids
    function getUserBids(address user) external view returns (Order[] memory) {
        uint256[] memory bidOrderIds = userBids[user];
        Order[] memory userBidList = new Order[](bidOrderIds.length);
        
        for (uint256 i = 0; i < bidOrderIds.length; i++) {
            userBidList[i] = orders[bidOrderIds[i]];
        }
        
        return userBidList;
    }
    
    // Get active orders
    function getActiveOrders() external view returns (Order[] memory) {
        uint256 totalOrders = _orderIdCounter;
        uint256 activeCount = 0;
        
        // Count active orders
        for (uint256 i = 0; i < totalOrders; i++) {
            if (orders[i].isActive && block.timestamp <= orders[i].endTime) {
                activeCount++;
            }
        }
        
        Order[] memory activeOrderList = new Order[](activeCount);
        uint256 index = 0;
        
        for (uint256 i = 0; i < totalOrders; i++) {
            if (orders[i].isActive && block.timestamp <= orders[i].endTime) {
                activeOrderList[index] = orders[i];
                index++;
            }
        }
        
        return activeOrderList;
    }
    
    // Admin functions
    function setMarketplaceFee(uint256 newFee) external onlyOwner {
        require(newFee <= MAX_FEE, "Fee too high");
        marketplaceFee = newFee;
        emit MarketplaceFeeUpdated(newFee);
    }
    
    function pause() external onlyOwner {
        _pause();
    }
    
    function unpause() external onlyOwner {
        _unpause();
    }
    
    function withdraw() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }
}