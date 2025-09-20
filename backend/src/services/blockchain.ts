import { ethers } from 'ethers'
import { PrismaClient } from '@prisma/client'

export class BlockchainService {
  private provider: ethers.JsonRpcProvider
  private aiAssetNFT: ethers.Contract
  private marketplace: ethers.Contract
  private licenseManager: ethers.Contract
  private prisma: PrismaClient

  constructor() {
    this.provider = new ethers.JsonRpcProvider(process.env.BLOCKCHAIN_RPC_URL || 'http://localhost:8545')
    this.prisma = new PrismaClient()

    // Initialize contracts
    this.initializeContracts()
  }

  private initializeContracts() {
    const contractAddresses = JSON.parse(process.env.CONTRACT_ADDRESSES || '{}')
    
    // AI Asset NFT Contract ABI (simplified)
    const aiAssetNFTABI = [
      "function mintAsset(uint8 assetType, string memory name, string memory description, string memory version, string memory ipfsHash, bool isPublic, uint256 royaltyPercentage, uint256 price, bool isForSale) external",
      "function updateAsset(uint256 tokenId, string memory newVersion, string memory newIPFSHash, string memory changelog) external",
      "function buyAsset(uint256 tokenId) external payable",
      "function getAsset(uint256 tokenId) external view returns (tuple(uint256 tokenId, uint8 assetType, string name, string description, string version, address creator, uint256 createdAt, uint256 updatedAt, string ipfsHash, bool isPublic, uint256 royaltyPercentage, uint256 price, bool isForSale))",
      "function getAllAssets() external view returns (tuple(uint256 tokenId, uint8 assetType, string name, string description, string version, address creator, uint256 createdAt, uint256 updatedAt, string ipfsHash, bool isPublic, uint256 royaltyPercentage, uint256 price, bool isForSale)[])",
      "function getAssetsForSale() external view returns (tuple(uint256 tokenId, uint8 assetType, string name, string description, string version, address creator, uint256 createdAt, uint256 updatedAt, string ipfsHash, bool isPublic, uint256 royaltyPercentage, uint256 price, bool isForSale)[])",
      "function ownerOf(uint256 tokenId) external view returns (address)",
      "function transferFrom(address from, address to, uint256 tokenId) external"
    ]

    // Marketplace Contract ABI (simplified)
    const marketplaceABI = [
      "function createFixedPriceOrder(uint256 assetTokenId, uint256 price) external",
      "function createAuctionOrder(uint256 assetTokenId, uint256 startingPrice, uint256 duration) external",
      "function buyFixedPriceOrder(uint256 orderId) external payable",
      "function placeBid(uint256 orderId) external payable",
      "function endAuction(uint256 orderId) external",
      "function cancelOrder(uint256 orderId) external",
      "function getOrder(uint256 orderId) external view returns (tuple(uint256 orderId, uint256 assetTokenId, address seller, address buyer, uint256 price, uint256 startTime, uint256 endTime, bool isActive, bool isAuction, uint256 highestBid, address highestBidder))",
      "function getActiveOrders() external view returns (tuple(uint256 orderId, uint256 assetTokenId, address seller, address buyer, uint256 price, uint256 startTime, uint256 endTime, bool isActive, bool isAuction, uint256 highestBid, address highestBidder)[])"
    ]

    // License Manager Contract ABI (simplified)
    const licenseManagerABI = [
      "function createLicense(uint256 assetTokenId, address licensee, uint8 licenseType, uint256 price, uint256 duration, string memory terms) external payable",
      "function recordUsage(uint256 licenseId, string memory action, string memory details) external",
      "function hasValidLicense(address user, uint256 assetTokenId) external view returns (bool)",
      "function getLicense(uint256 licenseId) external view returns (tuple(uint256 licenseId, uint256 assetTokenId, address licensor, address licensee, uint8 licenseType, uint256 price, uint256 duration, uint256 startTime, uint256 endTime, bool isActive, string terms, uint256 createdAt))"
    ]

    this.aiAssetNFT = new ethers.Contract(
      contractAddresses.AIAssetNFT,
      aiAssetNFTABI,
      this.provider
    )

    this.marketplace = new ethers.Contract(
      contractAddresses.Marketplace,
      marketplaceABI,
      this.provider
    )

    this.licenseManager = new ethers.Contract(
      contractAddresses.LicenseManager,
      licenseManagerABI,
      this.provider
    )
  }

  async mintAsset(
    wallet: ethers.Wallet,
    assetType: number,
    name: string,
    description: string,
    version: string,
    ipfsHash: string,
    isPublic: boolean,
    royaltyPercentage: number,
    price: bigint,
    isForSale: boolean
  ) {
    const contract = this.aiAssetNFT.connect(wallet)
    const tx = await contract.mintAsset(
      assetType,
      name,
      description,
      version,
      ipfsHash,
      isPublic,
      royaltyPercentage,
      price,
      isForSale
    )
    
    const receipt = await tx.wait()
    return { tx, receipt }
  }

  async buyAsset(wallet: ethers.Wallet, tokenId: number, value: bigint) {
    const contract = this.aiAssetNFT.connect(wallet)
    const tx = await contract.buyAsset(tokenId, { value })
    
    const receipt = await tx.wait()
    return { tx, receipt }
  }

  async createFixedPriceOrder(wallet: ethers.Wallet, assetTokenId: number, price: bigint) {
    const contract = this.marketplace.connect(wallet)
    const tx = await contract.createFixedPriceOrder(assetTokenId, price)
    
    const receipt = await tx.wait()
    return { tx, receipt }
  }

  async createAuctionOrder(
    wallet: ethers.Wallet,
    assetTokenId: number,
    startingPrice: bigint,
    duration: number
  ) {
    const contract = this.marketplace.connect(wallet)
    const tx = await contract.createAuctionOrder(assetTokenId, startingPrice, duration)
    
    const receipt = await tx.wait()
    return { tx, receipt }
  }

  async placeBid(wallet: ethers.Wallet, orderId: number, value: bigint) {
    const contract = this.marketplace.connect(wallet)
    const tx = await contract.placeBid(orderId, { value })
    
    const receipt = await tx.wait()
    return { tx, receipt }
  }

  async createLicense(
    wallet: ethers.Wallet,
    assetTokenId: number,
    licensee: string,
    licenseType: number,
    price: bigint,
    duration: number,
    terms: string
  ) {
    const contract = this.licenseManager.connect(wallet)
    const tx = await contract.createLicense(
      assetTokenId,
      licensee,
      licenseType,
      price,
      duration,
      terms,
      { value: price }
    )
    
    const receipt = await tx.wait()
    return { tx, receipt }
  }

  async getAsset(tokenId: number) {
    return await this.aiAssetNFT.getAsset(tokenId)
  }

  async getAllAssets() {
    return await this.aiAssetNFT.getAllAssets()
  }

  async getAssetsForSale() {
    return await this.aiAssetNFT.getAssetsForSale()
  }

  async getActiveOrders() {
    return await this.marketplace.getActiveOrders()
  }

  async getOrder(orderId: number) {
    return await this.marketplace.getOrder(orderId)
  }

  async hasValidLicense(userAddress: string, assetTokenId: number) {
    return await this.licenseManager.hasValidLicense(userAddress, assetTokenId)
  }

  async getLicense(licenseId: number) {
    return await this.licenseManager.getLicense(licenseId)
  }

  async getTransactionReceipt(txHash: string) {
    return await this.provider.getTransactionReceipt(txHash)
  }

  async getBlockNumber() {
    return await this.provider.getBlockNumber()
  }

  async getBalance(address: string) {
    return await this.provider.getBalance(address)
  }

  async formatEther(value: bigint) {
    return ethers.formatEther(value)
  }

  async parseEther(value: string) {
    return ethers.parseEther(value)
  }

  // Event listeners
  async listenToAssetMinted(callback: (event: any) => void) {
    this.aiAssetNFT.on('AssetMinted', callback)
  }

  async listenToAssetSold(callback: (event: any) => void) {
    this.aiAssetNFT.on('AssetSold', callback)
  }

  async listenToOrderCreated(callback: (event: any) => void) {
    this.marketplace.on('OrderCreated', callback)
  }

  async listenToOrderFilled(callback: (event: any) => void) {
    this.marketplace.on('OrderFilled', callback)
  }

  async listenToLicenseCreated(callback: (event: any) => void) {
    this.licenseManager.on('LicenseCreated', callback)
  }

  // Cleanup
  async cleanup() {
    this.aiAssetNFT.removeAllListeners()
    this.marketplace.removeAllListeners()
    this.licenseManager.removeAllListeners()
  }
}