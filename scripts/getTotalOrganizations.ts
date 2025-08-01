import { ethers } from "hardhat";

async function main() {
  // Contract address
  const contractAddress = "0xAab9Feae724F7251c6FCB9632423af9133C64480";
  
  // Get the contract factory
  const OrgFeedback = await ethers.getContractFactory("OrgFeedback");
  
  // Connect to the deployed contract
  const orgFeedback = OrgFeedback.attach(contractAddress);
  
  try {
    // Call the totalOrganizations getter function
    const totalOrgs = await orgFeedback.totalOrganizations();
    
    console.log("=".repeat(50));
    console.log("📊 OrgFeedback Contract Statistics");
    console.log("=".repeat(50));
    console.log(`Contract Address: ${contractAddress}`);
    console.log(`Total Organizations: ${totalOrgs.toString()}`);
    console.log("=".repeat(50));
    
  } catch (error) {
    console.error("❌ Error fetching total organizations:", error);
    process.exit(1);
  }
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });