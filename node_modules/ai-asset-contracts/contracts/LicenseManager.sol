// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

contract LicenseManager is Ownable, ReentrancyGuard, Pausable {
    
    // License types
    enum LicenseType { 
        COMMERCIAL,     // Full commercial use
        NON_COMMERCIAL, // Non-commercial use only
        RESEARCH,       // Research and educational use
        CUSTOM         // Custom terms
    }
    
    // License structure
    struct License {
        uint256 licenseId;
        uint256 assetTokenId;
        address licensor;
        address licensee;
        LicenseType licenseType;
        uint256 price;
        uint256 duration; // 0 = perpetual
        uint256 startTime;
        uint256 endTime;
        bool isActive;
        string terms; // Custom terms for CUSTOM license type
        uint256 createdAt;
    }
    
    // Usage tracking
    struct UsageRecord {
        uint256 licenseId;
        address user;
        uint256 timestamp;
        string action; // "download", "api_call", "modify", etc.
        string details;
    }
    
    // Mappings
    mapping(uint256 => License) public licenses;
    mapping(uint256 => UsageRecord[]) public licenseUsage;
    mapping(address => uint256[]) public userLicenses;
    mapping(address => uint256[]) public userIssuedLicenses;
    mapping(uint256 => bool) public assetLicensable; // Which assets can be licensed
    
    // Counters
    uint256 private _licenseIdCounter;
    
    // Events
    event LicenseCreated(
        uint256 indexed licenseId,
        uint256 indexed assetTokenId,
        address indexed licensor,
        address licensee,
        LicenseType licenseType,
        uint256 price
    );
    
    event LicenseActivated(
        uint256 indexed licenseId,
        address indexed licensee
    );
    
    event LicenseExpired(
        uint256 indexed licenseId
    );
    
    event UsageRecorded(
        uint256 indexed licenseId,
        address indexed user,
        string action
    );
    
    event AssetLicensabilityUpdated(
        uint256 indexed assetTokenId,
        bool licensable
    );
    
    // Modifiers
    modifier onlyLicenseOwner(uint256 licenseId) {
        require(licenses[licenseId].licensor == msg.sender, "Not the license owner");
        _;
    }
    
    modifier onlyLicensee(uint256 licenseId) {
        require(licenses[licenseId].licensee == msg.sender, "Not the licensee");
        _;
    }
    
    modifier validLicense(uint256 licenseId) {
        require(licenses[licenseId].licenseId != 0, "License does not exist");
        _;
    }
    
    modifier activeLicense(uint256 licenseId) {
        require(licenses[licenseId].isActive, "License not active");
        require(
            licenses[licenseId].endTime == 0 || block.timestamp <= licenses[licenseId].endTime,
            "License expired"
        );
        _;
    }
    
    // Create a new license
    function createLicense(
        uint256 assetTokenId,
        address licensee,
        LicenseType licenseType,
        uint256 price,
        uint256 duration,
        string memory terms
    ) external payable whenNotPaused nonReentrant {
        require(assetLicensable[assetTokenId], "Asset not licensable");
        require(licensee != address(0), "Invalid licensee");
        require(licensee != msg.sender, "Cannot license to self");
        require(msg.value >= price, "Insufficient payment");
        
        uint256 licenseId = _licenseIdCounter;
        _licenseIdCounter++;
        
        uint256 startTime = block.timestamp;
        uint256 endTime = duration > 0 ? startTime + duration : 0;
        
        License memory newLicense = License({
            licenseId: licenseId,
            assetTokenId: assetTokenId,
            licensor: msg.sender,
            licensee: licensee,
            licenseType: licenseType,
            price: price,
            duration: duration,
            startTime: startTime,
            endTime: endTime,
            isActive: true,
            terms: terms,
            createdAt: block.timestamp
        });
        
        licenses[licenseId] = newLicense;
        userLicenses[licensee].push(licenseId);
        userIssuedLicenses[msg.sender].push(licenseId);
        
        // Transfer payment to licensor
        if (price > 0) {
            payable(msg.sender).transfer(price);
        }
        
        // Refund excess payment
        if (msg.value > price) {
            payable(msg.sender).transfer(msg.value - price);
        }
        
        emit LicenseCreated(licenseId, assetTokenId, msg.sender, licensee, licenseType, price);
        emit LicenseActivated(licenseId, licensee);
    }
    
    // Record usage of a licensed asset
    function recordUsage(
        uint256 licenseId,
        string memory action,
        string memory details
    ) external validLicense(licenseId) activeLicense(licenseId) onlyLicensee(licenseId) {
        UsageRecord memory usage = UsageRecord({
            licenseId: licenseId,
            user: msg.sender,
            timestamp: block.timestamp,
            action: action,
            details: details
        });
        
        licenseUsage[licenseId].push(usage);
        
        emit UsageRecorded(licenseId, msg.sender, action);
    }
    
    // Check if user has valid license for asset
    function hasValidLicense(address user, uint256 assetTokenId) external view returns (bool) {
        uint256[] memory userLicenseIds = userLicenses[user];
        
        for (uint256 i = 0; i < userLicenseIds.length; i++) {
            License memory license = licenses[userLicenseIds[i]];
            if (license.assetTokenId == assetTokenId && 
                license.isActive && 
                (license.endTime == 0 || block.timestamp <= license.endTime)) {
                return true;
            }
        }
        
        return false;
    }
    
    // Get user's licenses
    function getUserLicenses(address user) external view returns (License[] memory) {
        uint256[] memory licenseIds = userLicenses[user];
        License[] memory userLicenseList = new License[](licenseIds.length);
        
        for (uint256 i = 0; i < licenseIds.length; i++) {
            userLicenseList[i] = licenses[licenseIds[i]];
        }
        
        return userLicenseList;
    }
    
    // Get licenses issued by user
    function getIssuedLicenses(address user) external view returns (License[] memory) {
        uint256[] memory licenseIds = userIssuedLicenses[user];
        License[] memory issuedLicenseList = new License[](licenseIds.length);
        
        for (uint256 i = 0; i < licenseIds.length; i++) {
            issuedLicenseList[i] = licenses[licenseIds[i]];
        }
        
        return issuedLicenseList;
    }
    
    // Get license usage history
    function getLicenseUsage(uint256 licenseId) external view returns (UsageRecord[] memory) {
        return licenseUsage[licenseId];
    }
    
    // Deactivate license
    function deactivateLicense(uint256 licenseId) external validLicense(licenseId) onlyLicenseOwner(licenseId) {
        licenses[licenseId].isActive = false;
        emit LicenseExpired(licenseId);
    }
    
    // Set asset licensability
    function setAssetLicensability(uint256 assetTokenId, bool licensable) external onlyOwner {
        assetLicensable[assetTokenId] = licensable;
        emit AssetLicensabilityUpdated(assetTokenId, licensable);
    }
    
    // Batch set asset licensability
    function batchSetAssetLicensability(
        uint256[] memory assetTokenIds,
        bool[] memory licensableStatuses
    ) external onlyOwner {
        require(assetTokenIds.length == licensableStatuses.length, "Arrays length mismatch");
        
        for (uint256 i = 0; i < assetTokenIds.length; i++) {
            assetLicensable[assetTokenIds[i]] = licensableStatuses[i];
            emit AssetLicensabilityUpdated(assetTokenIds[i], licensableStatuses[i]);
        }
    }
    
    // Get license details
    function getLicense(uint256 licenseId) external view validLicense(licenseId) returns (License memory) {
        return licenses[licenseId];
    }
    
    // Check if license is expired
    function isLicenseExpired(uint256 licenseId) external view validLicense(licenseId) returns (bool) {
        License memory license = licenses[licenseId];
        return !license.isActive || (license.endTime > 0 && block.timestamp > license.endTime);
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