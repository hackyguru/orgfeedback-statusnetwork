import { ethers } from "hardhat";

async function main() {
  const contractAddress = "0x4035a97483d7E7C5dE70c50B6CD7cDA494D4b79d";
  const orgId = "0xdcC5bA35614F40F75d07402d81784214CbE853a9";
  const ownerAddress = "0xdcC5bA35614F40F75d07402d81784214CbE853a9";
  
  const OrgFeedback = await ethers.getContractFactory("OrgFeedback");
  const contract = OrgFeedback.attach(contractAddress);
  
  console.log("🔍 Debug Owner View - getOrgMembers");
  console.log("=====================================");
  console.log(`Owner address: ${ownerAddress}`);
  console.log(`Organization: ${orgId}`);
  console.log("");
  
  try {
    // Check organization exists
    const orgMetadata = await contract.getOrgMetadata(orgId);
    console.log("✅ Organization found:");
    console.log(`  Name: ${orgMetadata[0]}`);
    console.log(`  Owner: ${orgMetadata[3]}`);
    console.log("");
    
    // Check if owner address matches
    const isOwnerMatch = ownerAddress.toLowerCase() === orgMetadata[3].toLowerCase();
    console.log(`🔑 Owner match: ${isOwnerMatch ? '✅' : '❌'}`);
    console.log("");
    
    // Check owner's roles
    const isMember = await contract.isMember(orgId, ownerAddress);
    const isModerator = await contract.isModerator(orgId, ownerAddress);
    const isOwner = isOwnerMatch;
    
    console.log("👤 Owner Roles:");
    console.log(`  Is Member: ${isMember ? '✅' : '❌'}`);
    console.log(`  Is Moderator: ${isModerator ? '✅' : '❌'}`);
    console.log(`  Is Owner: ${isOwner ? '✅' : '❌'}`);
    console.log("");
    
    // Check access requirements
    const hasAccess = isMember || isOwner || isModerator;
    console.log(`🔐 Access Check: ${hasAccess ? '✅ ALLOWED' : '❌ DENIED'}`);
    console.log("");
    
    if (hasAccess) {
      console.log("📋 Attempting to get members as owner...");
      try {
        const members = await contract.getOrgMembers(orgId);
        console.log(`✅ SUCCESS! Found ${members.length} members:`);
        members.forEach((member, index) => {
          console.log(`  ${index + 1}. ${member}`);
        });
        
        // Also check if there are any members in the memberList
        console.log("");
        console.log("🔍 Additional checks:");
        
        // Try to get total members count (if available)
        try {
          const memberCount = members.length;
          console.log(`  Total members in list: ${memberCount}`);
          
          if (memberCount === 0) {
            console.log("  ⚠️  Member list is empty - this might be the issue!");
            console.log("  💡 Check if members were properly added to memberList");
          }
        } catch (countError) {
          console.log("  ❌ Could not get member count");
        }
        
      } catch (memberError) {
        console.error("❌ FAILED to get members:", memberError.message);
        console.log("");
        console.log("🔍 Detailed error:");
        console.error(memberError);
      }
    } else {
      console.log("❌ Owner doesn't have access - this is unexpected!");
    }
    
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 