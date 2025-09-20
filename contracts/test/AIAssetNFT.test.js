const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("AIAssetNFT", function () {
  let aiAssetNFT;
  let owner;
  let addr1;
  let addr2;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();

    const AIAssetNFT = await ethers.getContractFactory("AIAssetNFT");
    aiAssetNFT = await AIAssetNFT.deploy();
    await aiAssetNFT.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await aiAssetNFT.owner()).to.equal(owner.address);
    });

    it("Should have correct name and symbol", async function () {
      expect(await aiAssetNFT.name()).to.equal("AI Asset NFT");
      expect(await aiAssetNFT.symbol()).to.equal("AIASSET");
    });
  });

  describe("Minting", function () {
    it("Should mint a new asset", async function () {
      const assetType = 0; // MODEL
      const name = "Test Model";
      const description = "A test AI model";
      const version = "1.0.0";
      const ipfsHash = "QmTestHash123";
      const isPublic = true;
      const royaltyPercentage = 250; // 2.5%
      const price = ethers.parseEther("1.0");
      const isForSale = true;

      await expect(
        aiAssetNFT.mintAsset(
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
      ).to.emit(aiAssetNFT, "AssetMinted")
        .withArgs(0, owner.address, assetType, name, ipfsHash);

      const asset = await aiAssetNFT.getAsset(0);
      expect(asset.name).to.equal(name);
      expect(asset.assetType).to.equal(assetType);
      expect(asset.creator).to.equal(owner.address);
    });

    it("Should reject minting with duplicate IPFS hash", async function () {
      const ipfsHash = "QmTestHash123";
      
      await aiAssetNFT.mintAsset(0, "Model 1", "Description", "1.0.0", ipfsHash, true, 250, ethers.parseEther("1.0"), true);
      
      await expect(
        aiAssetNFT.mintAsset(0, "Model 2", "Description", "1.0.0", ipfsHash, true, 250, ethers.parseEther("1.0"), true)
      ).to.be.revertedWith("IPFS hash already used");
    });

    it("Should reject invalid royalty percentage", async function () {
      await expect(
        aiAssetNFT.mintAsset(0, "Model", "Description", "1.0.0", "QmHash", true, 1500, ethers.parseEther("1.0"), true)
      ).to.be.revertedWith("Royalty cannot exceed 10%");
    });
  });

  describe("Asset Updates", function () {
    beforeEach(async function () {
      await aiAssetNFT.mintAsset(
        0, "Test Model", "Description", "1.0.0", "QmHash1", true, 250, ethers.parseEther("1.0"), true
      );
    });

    it("Should update asset version", async function () {
      const newVersion = "1.1.0";
      const newIPFSHash = "QmHash2";
      const changelog = "Added new features";

      await expect(
        aiAssetNFT.updateAsset(0, newVersion, newIPFSHash, changelog)
      ).to.emit(aiAssetNFT, "AssetUpdated")
        .withArgs(0, newVersion, newIPFSHash, changelog);

      const asset = await aiAssetNFT.getAsset(0);
      expect(asset.version).to.equal(newVersion);
      expect(asset.ipfsHash).to.equal(newIPFSHash);
    });

    it("Should only allow asset owner to update", async function () {
      await expect(
        aiAssetNFT.connect(addr1).updateAsset(0, "1.1.0", "QmHash2", "Changelog")
      ).to.be.revertedWith("Not the asset owner");
    });
  });

  describe("Asset Trading", function () {
    beforeEach(async function () {
      await aiAssetNFT.mintAsset(
        0, "Test Model", "Description", "1.0.0", "QmHash1", true, 250, ethers.parseEther("1.0"), true
      );
    });

    it("Should allow buying an asset", async function () {
      const price = ethers.parseEther("1.0");
      
      await expect(
        aiAssetNFT.connect(addr1).buyAsset(0, { value: price })
      ).to.emit(aiAssetNFT, "AssetSold")
        .withArgs(0, owner.address, addr1.address, price);

      expect(await aiAssetNFT.ownerOf(0)).to.equal(addr1.address);
    });

    it("Should reject insufficient payment", async function () {
      const insufficientPrice = ethers.parseEther("0.5");
      
      await expect(
        aiAssetNFT.connect(addr1).buyAsset(0, { value: insufficientPrice })
      ).to.be.revertedWith("Insufficient payment");
    });

    it("Should reject buying own asset", async function () {
      await expect(
        aiAssetNFT.buyAsset(0, { value: ethers.parseEther("1.0") })
      ).to.be.revertedWith("Cannot buy own asset");
    });
  });

  describe("Pausable", function () {
    it("Should pause and unpause", async function () {
      await aiAssetNFT.pause();
      expect(await aiAssetNFT.paused()).to.be.true;

      await aiAssetNFT.unpause();
      expect(await aiAssetNFT.paused()).to.be.false;
    });

    it("Should reject minting when paused", async function () {
      await aiAssetNFT.pause();
      
      await expect(
        aiAssetNFT.mintAsset(0, "Model", "Description", "1.0.0", "QmHash", true, 250, ethers.parseEther("1.0"), true)
      ).to.be.revertedWith("Pausable: paused");
    });
  });
});