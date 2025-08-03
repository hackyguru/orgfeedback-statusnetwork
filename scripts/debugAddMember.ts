import { ethers } from "hardhat";

async function main() {
  const contractAddress = "0x4035a97483d7E7C5dE70c50B6CD7cDA494D4b79d";
  const orgId = "0xdcC5bA35614F40F75d07402d81784214CbE853a9";
  const newMemberAddress = "0x2028A2a3f75E5f58cCE5C5Ceb1Db24542FaFDc1c";
  
  // Get the contract
  const OrgFeedback = await ethers.getContractFactory("OrgFeedback");
  const contract = OrgFeedback.attach(contractAddress);
  
  console.log("🔍 Debugging Add Member");
  console.log("=====================================");
  console.log(`Organization ID: ${orgId}`);
  console.log(`New Member Address: ${newMemberAddress}`);
  console.log("");
  
  try {
    // Check if organization exists
    const orgMetadata = await contract.getOrgMetadata(orgId);
    console.log("✅ Organization exists:");
    console.log(`  Name: ${orgMetadata[0]}`);
    console.log(`  Description: ${orgMetadata[1]}`);
    console.log(`  Owner: ${orgMetadata[3]}`);
    console.log("");
    
    // Check if the caller is the owner or moderator
    const [signer] = await ethers.getSigners();
    const isOwner = orgMetadata[3].toLowerCase() === signer.address.toLowerCase();
    const isModerator = await contract.isModerator(orgId, signer.address);
    
    console.log(`📋 Caller Info:`);
    console.log(`  Caller Address: ${signer.address}`);
    console.log(`  Is Owner: ${isOwner ? '✅ YES' : '❌ NO'}`);
    console.log(`  Is Moderator: ${isModerator ? '✅ YES' : '❌ NO'}`);
    console.log(`  Can Add Members: ${(isOwner || isModerator) ? '✅ YES' : '❌ NO'}`);
    console.log("");
    
    // Check if the target address is already a member
    const isAlreadyMember = await contract.isMember(orgId, newMemberAddress);
    console.log(`👥 Target Address Status:`);
    console.log(`  Is Already Member: ${isAlreadyMember ? '❌ ALREADY A MEMBER!' : '✅ NOT A MEMBER (CAN ADD)'}`);
    console.log("");
    
    // Get current members
    try {
      const members = await contract.getOrgMembers(orgId);
      console.log(`👥 Current Members (${members.length}):`);
      members.forEach((member: string, index: number) => {
        console.log(`  ${index + 1}. ${member} ${member.toLowerCase() === orgMetadata[3].toLowerCase() ? '(Owner)' : ''}`);
      });
      console.log("");
    } catch (error) {
      console.log("❌ Could not fetch members");
      console.log("");
    }
    
    // Provide solution
    console.log("🔧 DIAGNOSIS:");
    if (!isOwner && !isModerator) {
      console.log("❌ You are not the organization owner or moderator. Only owners/moderators can add members.");
    } else if (isAlreadyMember) {
      console.log("❌ This address is already a member of the organization.");
    } else {
      console.log("✅ All requirements met. The addMember call should work.");
      console.log("🤔 If it's still failing, there might be a gas issue or network problem.");
    }
    
  } catch (error) {
    console.error("❌ Error:", error);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});