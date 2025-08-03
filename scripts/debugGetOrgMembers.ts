import { ethers } from "hardhat";

async function main() {
  const contractAddress = "0x4035a97483d7E7C5dE70c50B6CD7cDA494D4b79d";
  const orgId = "0xdcC5bA35614F40F75d07402d81784214CbE853a9";
  
  const OrgFeedback = await ethers.getContractFactory("OrgFeedback");
  const contract = OrgFeedback.attach(contractAddress);
  
  const [signer] = await ethers.getSigners();
  const currentAddress = await signer.getAddress();
  
  console.log("🔍 Debug getOrgMembers Access");
  console.log("===============================");
  console.log(`Current signer: ${currentAddress}`);
  console.log(`Organization: ${orgId}`);
  console.log("");
  
  try {
    // Check organization exists
    const orgMetadata = await contract.getOrgMetadata(orgId);
    console.log("✅ Organization found:");
    console.log(`  Name: ${orgMetadata[0]}`);
    console.log(`  Owner: ${orgMetadata[3]}`);
    console.log("");
    
    // Check current user's roles
    const isMember = await contract.isMember(orgId, currentAddress);
    const isModerator = await contract.isModerator(orgId, currentAddress);
    const isOwner = currentAddress.toLowerCase() === orgMetadata[3].toLowerCase();
    
    console.log("👤 Current User Roles:");
    console.log(`  Is Member: ${isMember ? '✅' : '❌'}`);
    console.log(`  Is Moderator: ${isModerator ? '✅' : '❌'}`);
    console.log(`  Is Owner: ${isOwner ? '✅' : '❌'}`);
    console.log("");
    
    // Check access requirements
    const hasAccess = isMember || isOwner || isModerator;
    console.log(`🔐 Access Check: ${hasAccess ? '✅ ALLOWED' : '❌ DENIED'}`);
    console.log("");
    
    if (hasAccess) {
      console.log("📋 Attempting to get members...");
      try {
        const members = await contract.getOrgMembers(orgId);
        console.log(`✅ SUCCESS! Found ${members.length} members:`);
        members.forEach((member, index) => {
          console.log(`  ${index + 1}. ${member}`);
        });
      } catch (memberError) {
        console.error("❌ FAILED to get members:", memberError.message);
        console.log("");
        console.log("🔍 Detailed error:");
        console.error(memberError);
      }
    } else {
      console.log("❌ Cannot call getOrgMembers - insufficient permissions");
      console.log("");
      console.log("💡 To fix this:");
      console.log("1. Connect with the owner's wallet");
      console.log("2. Or add this address as a member first");
      console.log("3. Or connect with an existing member/moderator");
    }
    
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});