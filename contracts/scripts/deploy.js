const { ethers } = require("hardhat");

async function main() {
  console.log("Deploying AI Asset Marketplace contracts...");

  // Get the contract factories
  const AIAssetNFT = await ethers.getContractFactory("AIAssetNFT");
  const LicenseManager = await ethers.getContractFactory("LicenseManager");
  const Marketplace = await ethers.getContractFactory("Marketplace");

  // Deploy AIAssetNFT
  console.log("Deploying AIAssetNFT...");
  const aiAssetNFT = await AIAssetNFT.deploy();
  await aiAssetNFT.waitForDeployment();
  const aiAssetNFTAddress = await aiAssetNFT.getAddress();
  console.log("AIAssetNFT deployed to:", aiAssetNFTAddress);

  // Deploy LicenseManager
  console.log("Deploying LicenseManager...");
  const licenseManager = await LicenseManager.deploy();
  await licenseManager.waitForDeployment();
  const licenseManagerAddress = await licenseManager.getAddress();
  console.log("LicenseManager deployed to:", licenseManagerAddress);

  // Deploy Marketplace
  console.log("Deploying Marketplace...");
  const marketplace = await Marketplace.deploy(aiAssetNFTAddress, licenseManagerAddress);
  await marketplace.waitForDeployment();
  const marketplaceAddress = await marketplace.getAddress();
  console.log("Marketplace deployed to:", marketplaceAddress);

  // Save deployment addresses
  const deploymentInfo = {
    network: hre.network.name,
    contracts: {
      AIAssetNFT: aiAssetNFTAddress,
      LicenseManager: licenseManagerAddress,
      Marketplace: marketplaceAddress
    },
    timestamp: new Date().toISOString()
  };

  const fs = require('fs');
  const path = require('path');
  
  // Create deployments directory if it doesn't exist
  const deploymentsDir = path.join(__dirname, '..', 'deployments');
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  // Save deployment info
  const deploymentFile = path.join(deploymentsDir, `${hre.network.name}.json`);
  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));

  console.log("\n=== Deployment Summary ===");
  console.log("Network:", hre.network.name);
  console.log("AIAssetNFT:", aiAssetNFTAddress);
  console.log("LicenseManager:", licenseManagerAddress);
  console.log("Marketplace:", marketplaceAddress);
  console.log("Deployment info saved to:", deploymentFile);

  // Verify contracts on Etherscan (if not localhost)
  if (hre.network.name !== "localhost" && hre.network.name !== "hardhat") {
    console.log("\nWaiting for block confirmations before verification...");
    await new Promise(resolve => setTimeout(resolve, 30000));

    try {
      console.log("Verifying AIAssetNFT...");
      await hre.run("verify:verify", {
        address: aiAssetNFTAddress,
        constructorArguments: [],
      });

      console.log("Verifying LicenseManager...");
      await hre.run("verify:verify", {
        address: licenseManagerAddress,
        constructorArguments: [],
      });

      console.log("Verifying Marketplace...");
      await hre.run("verify:verify", {
        address: marketplaceAddress,
        constructorArguments: [aiAssetNFTAddress, licenseManagerAddress],
      });

      console.log("All contracts verified successfully!");
    } catch (error) {
      console.log("Verification failed:", error.message);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });