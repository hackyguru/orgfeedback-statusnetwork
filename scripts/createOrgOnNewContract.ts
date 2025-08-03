import { ethers } from "hardhat";

async function main() {
  const contractAddress = "0x2BfeB9b810CD42C12018076031A548FB357517FC";
  
  const OrgFeedback = await ethers.getContractFactory("OrgFeedback");
  const contract = OrgFeedback.attach(contractAddress);
  
  const [signer] = await ethers.getSigners();
  const ownerAddress = await signer.getAddress();
  
  console.log("🏗️  Creating Organization on New Contract");
  console.log("========================================");
  console.log(`Contract: ${contractAddress}`);
  console.log(`Owner: ${ownerAddress}`);
  console.log("");
  
  try {
    // Check if organization already exists
    try {
      const orgMetadata = await contract.getOrgMetadata(ownerAddress);
      console.log("❌ Organization already exists!");
      console.log(`  Name: ${orgMetadata[0]}`);
      console.log(`  Owner: ${orgMetadata[3]}`);
      return;
    } catch (error) {
      // Organization doesn't exist, proceed to create
      console.log("✅ Organization doesn't exist, creating...");
    }
    
    // Create organization
    const tx = await contract.createOrganization("Status", "A test organization for feedback");
    console.log("📝 Creating organization...");
    console.log(`  Transaction: ${tx.hash}`);
    
    const receipt = await tx.wait();
    console.log("✅ Organization created successfully!");
    console.log(`  Block: ${receipt.blockNumber}`);
    
    // Verify organization was created
    const orgMetadata = await contract.getOrgMetadata(ownerAddress);
    console.log("");
    console.log("📋 Organization Details:");
    console.log(`  Name: ${orgMetadata[0]}`);
    console.log(`  Description: ${orgMetadata[1]}`);
    console.log(`  Logo CID: ${orgMetadata[2]}`);
    console.log(`  Owner: ${orgMetadata[3]}`);
    
    // Check owner's roles
    const isMember = await contract.isMember(ownerAddress, ownerAddress);
    const isModerator = await contract.isModerator(ownerAddress, ownerAddress);
    
    console.log("");
    console.log("👤 Owner Roles:");
    console.log(`  Is Member: ${isMember ? '✅' : '❌'}`);
    console.log(`  Is Moderator: ${isModerator ? '✅' : '❌'}`);
    
    // Test getOrgMembers
    console.log("");
    console.log("📋 Testing getOrgMembers...");
    try {
      const members = await contract.getOrgMembers(ownerAddress);
      console.log(`✅ SUCCESS! Found ${members.length} members:`);
      members.forEach((member, index) => {
        console.log(`  ${index + 1}. ${member}`);
      });
    } catch (memberError) {
      console.error("❌ FAILED to get members:", memberError.message);
    }
    
  } catch (error) {
    console.error("❌ Error creating organization:", error.message);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 