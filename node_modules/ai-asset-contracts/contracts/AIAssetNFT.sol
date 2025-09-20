// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract AIAssetNFT is ERC721, ERC721URIStorage, ERC721Enumerable, Ownable, Pausable, ReentrancyGuard {
    using Counters for Counters.Counter;
    
    Counters.Counter private _tokenIdCounter;
    
    // Asset types
    enum AssetType { MODEL, SCRIPT, DATASET }
    
    // Asset structure
    struct Asset {
        uint256 tokenId;
        AssetType assetType;
        string name;
        string description;
        string version;
        address creator;
        uint256 createdAt;
        uint256 updatedAt;
        string ipfsHash;
        bool isPublic;
        uint256 royaltyPercentage; // Basis points (100 = 1%)
        uint256 price; // In wei
        bool isForSale;
    }
    
    // Version history for each asset
    struct Version {
        string version;
        string ipfsHash;
        uint256 timestamp;
        string changelog;
    }
    
    // Mappings
    mapping(uint256 => Asset) public assets;
    mapping(uint256 => Version[]) public assetVersions;
    mapping(address => uint256[]) public creatorAssets;
    mapping(string => bool) public usedIPFSHashes;
    
    // Events
    event AssetMinted(
        uint256 indexed tokenId,
        address indexed creator,
        AssetType assetType,
        string name,
        string ipfsHash
    );
    
    event AssetUpdated(
        uint256 indexed tokenId,
        string newVersion,
        string newIPFSHash,
        string changelog
    );
    
    event AssetPriceUpdated(
        uint256 indexed tokenId,
        uint256 newPrice,
        bool isForSale
    );
    
    event AssetSold(
        uint256 indexed tokenId,
        address indexed seller,
        address indexed buyer,
        uint256 price
    );
    
    event RoyaltyPaid(
        uint256 indexed tokenId,
        address indexed creator,
        uint256 amount
    );
    
    constructor() ERC721("AI Asset NFT", "AIASSET") {}
    
    // Modifiers
    modifier onlyAssetOwner(uint256 tokenId) {
        require(ownerOf(tokenId) == msg.sender, "Not the asset owner");
        _;
    }
    
    modifier validAssetType(uint8 assetType) {
        require(assetType < 3, "Invalid asset type");
        _;
    }
    
    modifier validRoyaltyPercentage(uint256 royaltyPercentage) {
        require(royaltyPercentage <= 1000, "Royalty cannot exceed 10%");
        _;
    }
    
    // Mint new AI asset
    function mintAsset(
        AssetType assetType,
        string memory name,
        string memory description,
        string memory version,
        string memory ipfsHash,
        bool isPublic,
        uint256 royaltyPercentage,
        uint256 price,
        bool isForSale
    ) external whenNotPaused validAssetType(uint8(assetType)) validRoyaltyPercentage(royaltyPercentage) {
        require(bytes(ipfsHash).length > 0, "IPFS hash required");
        require(!usedIPFSHashes[ipfsHash], "IPFS hash already used");
        require(bytes(name).length > 0, "Name required");
        
        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();
        
        _safeMint(msg.sender, tokenId);
        _setTokenURI(tokenId, ipfsHash);
        
        Asset memory newAsset = Asset({
            tokenId: tokenId,
            assetType: assetType,
            name: name,
            description: description,
            version: version,
            creator: msg.sender,
            createdAt: block.timestamp,
            updatedAt: block.timestamp,
            ipfsHash: ipfsHash,
            isPublic: isPublic,
            royaltyPercentage: royaltyPercentage,
            price: price,
            isForSale: isForSale
        });
        
        assets[tokenId] = newAsset;
        creatorAssets[msg.sender].push(tokenId);
        usedIPFSHashes[ipfsHash] = true;
        
        // Add initial version
        assetVersions[tokenId].push(Version({
            version: version,
            ipfsHash: ipfsHash,
            timestamp: block.timestamp,
            changelog: "Initial version"
        }));
        
        emit AssetMinted(tokenId, msg.sender, assetType, name, ipfsHash);
    }
    
    // Update asset with new version
    function updateAsset(
        uint256 tokenId,
        string memory newVersion,
        string memory newIPFSHash,
        string memory changelog
    ) external onlyAssetOwner(tokenId) whenNotPaused {
        require(bytes(newIPFSHash).length > 0, "IPFS hash required");
        require(!usedIPFSHashes[newIPFSHash], "IPFS hash already used");
        require(bytes(newVersion).length > 0, "Version required");
        
        Asset storage asset = assets[tokenId];
        asset.version = newVersion;
        asset.updatedAt = block.timestamp;
        asset.ipfsHash = newIPFSHash;
        
        _setTokenURI(tokenId, newIPFSHash);
        usedIPFSHashes[newIPFSHash] = true;
        
        // Add new version to history
        assetVersions[tokenId].push(Version({
            version: newVersion,
            ipfsHash: newIPFSHash,
            timestamp: block.timestamp,
            changelog: changelog
        }));
        
        emit AssetUpdated(tokenId, newVersion, newIPFSHash, changelog);
    }
    
    // Update asset price and sale status
    function updateAssetPrice(
        uint256 tokenId,
        uint256 newPrice,
        bool isForSale
    ) external onlyAssetOwner(tokenId) whenNotPaused {
        Asset storage asset = assets[tokenId];
        asset.price = newPrice;
        asset.isForSale = isForSale;
        
        emit AssetPriceUpdated(tokenId, newPrice, isForSale);
    }
    
    // Buy asset
    function buyAsset(uint256 tokenId) external payable nonReentrant whenNotPaused {
        Asset storage asset = assets[tokenId];
        require(asset.isForSale, "Asset not for sale");
        require(msg.value >= asset.price, "Insufficient payment");
        require(ownerOf(tokenId) != msg.sender, "Cannot buy own asset");
        
        address seller = ownerOf(tokenId);
        uint256 salePrice = asset.price;
        
        // Calculate royalty
        uint256 royaltyAmount = (salePrice * asset.royaltyPercentage) / 10000;
        uint256 sellerAmount = salePrice - royaltyAmount;
        
        // Transfer ownership
        _transfer(seller, msg.sender, tokenId);
        
        // Update asset
        asset.isForSale = false;
        asset.price = 0;
        
        // Transfer payments
        if (royaltyAmount > 0) {
            payable(asset.creator).transfer(royaltyAmount);
            emit RoyaltyPaid(tokenId, asset.creator, royaltyAmount);
        }
        
        payable(seller).transfer(sellerAmount);
        
        // Refund excess payment
        if (msg.value > salePrice) {
            payable(msg.sender).transfer(msg.value - salePrice);
        }
        
        emit AssetSold(tokenId, seller, msg.sender, salePrice);
    }
    
    // Get asset details
    function getAsset(uint256 tokenId) external view returns (Asset memory) {
        return assets[tokenId];
    }
    
    // Get asset versions
    function getAssetVersions(uint256 tokenId) external view returns (Version[] memory) {
        return assetVersions[tokenId];
    }
    
    // Get creator's assets
    function getCreatorAssets(address creator) external view returns (uint256[] memory) {
        return creatorAssets[creator];
    }
    
    // Get all assets (for marketplace)
    function getAllAssets() external view returns (Asset[] memory) {
        uint256 totalSupply = _tokenIdCounter.current();
        Asset[] memory allAssets = new Asset[](totalSupply);
        
        for (uint256 i = 0; i < totalSupply; i++) {
            allAssets[i] = assets[i];
        }
        
        return allAssets;
    }
    
    // Get assets for sale
    function getAssetsForSale() external view returns (Asset[] memory) {
        uint256 totalSupply = _tokenIdCounter.current();
        uint256 forSaleCount = 0;
        
        // Count assets for sale
        for (uint256 i = 0; i < totalSupply; i++) {
            if (assets[i].isForSale) {
                forSaleCount++;
            }
        }
        
        Asset[] memory forSaleAssets = new Asset[](forSaleCount);
        uint256 index = 0;
        
        for (uint256 i = 0; i < totalSupply; i++) {
            if (assets[i].isForSale) {
                forSaleAssets[index] = assets[i];
                index++;
            }
        }
        
        return forSaleAssets;
    }
    
    // Override required functions
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId,
        uint256 batchSize
    ) internal override(ERC721, ERC721Enumerable) {
        super._beforeTokenTransfer(from, to, tokenId, batchSize);
    }
    
    function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage) {
        super._burn(tokenId);
    }
    
    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }
    
    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721Enumerable, ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
    
    // Admin functions
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