import { ethers } from "hardhat";

async function main() {
  const contractAddress = "0x4035a97483d7E7C5dE70c50B6CD7cDA494D4b79d";
  const orgId = "0xdcC5bA35614F40F75d07402d81784214CbE853a9";
  const moderatorAddress = "0x18331B7b011d822F963236d0b6b8775Fb86fc1AF";
  
  // Get the contract
  const OrgFeedback = await ethers.getContractFactory("OrgFeedback");
  const contract = OrgFeedback.attach(contractAddress);
  
  console.log("🔍 Debugging Moderator Addition");
  console.log("=====================================");
  console.log(`Organization ID: ${orgId}`);
  console.log(`Moderator Address: ${moderatorAddress}`);
  console.log("");
  
  try {
    // Check if organization exists
    const orgMetadata = await contract.getOrgMetadata(orgId);
    console.log("✅ Organization exists:");
    console.log(`  Name: ${orgMetadata[0]}`);
    console.log(`  Description: ${orgMetadata[1]}`);
    console.log(`  Owner: ${orgMetadata[3]}`);
    console.log("");
    
    // Check if the caller is the owner
    const [signer] = await ethers.getSigners();
    const isOwner = orgMetadata[3].toLowerCase() === signer.address.toLowerCase();
    console.log(`📋 Caller Info:`);
    console.log(`  Caller Address: ${signer.address}`);
    console.log(`  Is Owner: ${isOwner ? '✅ YES' : '❌ NO'}`);
    console.log("");
    
    // Check if the target address is a member
    const isMember = await contract.isMember(orgId, moderatorAddress);
    console.log(`👥 Membership Status:`);
    console.log(`  Is Member: ${isMember ? '✅ YES' : '❌ NO - MUST ADD AS MEMBER FIRST!'}`);
    
    // Check if already a moderator
    const isModerator = await contract.isModerator(orgId, moderatorAddress);
    console.log(`  Is Moderator: ${isModerator ? '❌ ALREADY MODERATOR' : '✅ NOT YET'}`);
    console.log("");
    
    // Get all members
    try {
      const members = await contract.getOrgMembers(orgId);
      console.log(`👥 Current Members (${members.length}):`);
      members.forEach((member: string, index: number) => {
        console.log(`  ${index + 1}. ${member}`);
      });
      console.log("");
    } catch (error) {
      console.log("❌ Could not fetch members (you might not be a member)");
      console.log("");
    }
    
    // Provide solution
    console.log("🔧 SOLUTION:");
    if (!isOwner) {
      console.log("❌ You are not the organization owner. Only owners can add moderators.");
    } else if (!isMember) {
      console.log("1. First add the address as a member using 'Add Member'");
      console.log("2. Then promote them to moderator using 'Add Moderator'");
    } else if (isModerator) {
      console.log("❌ This address is already a moderator.");
    } else {
      console.log("✅ All requirements met. The addModerator call should work.");
    }
    
  } catch (error) {
    console.error("❌ Error:", error);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});