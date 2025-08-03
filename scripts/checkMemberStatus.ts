import { ethers } from "hardhat";

async function main() {
  const contractAddress = "0x2BfeB9b810CD42C12018076031A548FB357517FC";
  const orgId = "0x18331B7b011d822F963236d0b6b8775Fb86fc1AF";
  const targetAddress = "0x2028A2a3f75E5f58cCE5C5Ceb1Db24542FaFDc1c";
  
  const OrgFeedback = await ethers.getContractFactory("OrgFeedback");
  const contract = OrgFeedback.attach(contractAddress);
  
  console.log("🔍 Check Member Status");
  console.log("=====================");
  console.log(`Organization: ${orgId}`);
  console.log(`Target Address: ${targetAddress}`);
  console.log("");
  
  try {
    // Check if organization exists
    const orgMetadata = await contract.getOrgMetadata(orgId);
    console.log("✅ Organization found:");
    console.log(`  Name: ${orgMetadata[0]}`);
    console.log(`  Owner: ${orgMetadata[3]}`);
    console.log("");
    
    // Check target address status
    const isMember = await contract.isMember(orgId, targetAddress);
    const isModerator = await contract.isModerator(orgId, targetAddress);
    const isOwner = targetAddress.toLowerCase() === orgMetadata[3].toLowerCase();
    
    console.log("👤 Target Address Status:");
    console.log(`  Is Member: ${isMember ? '✅' : '❌'}`);
    console.log(`  Is Moderator: ${isModerator ? '✅' : '❌'}`);
    console.log(`  Is Owner: ${isOwner ? '✅' : '❌'}`);
    console.log("");
    
    if (isMember) {
      console.log("❌ CANNOT ADD - Address is already a member!");
      console.log("💡 Try adding a different address instead.");
    } else {
      console.log("✅ CAN ADD - Address is not a member yet.");
    }
    
    // Show current members
    console.log("");
    console.log("📋 Current Members:");
    try {
      const members = await contract.getOrgMembers(orgId);
      if (members.length > 0) {
        members.forEach((member, index) => {
          const memberIsModerator = member.toLowerCase() === targetAddress.toLowerCase() ? isModerator : false;
          const memberIsOwner = member.toLowerCase() === orgMetadata[3].toLowerCase();
          let role = 'Member';
          if (memberIsOwner) role = 'Owner';
          else if (memberIsModerator) role = 'Moderator';
          
          console.log(`  ${index + 1}. ${member} (${role})`);
        });
      } else {
        console.log("  No members found");
      }
    } catch (memberError) {
      console.log("  ❌ Could not fetch members:", memberError.message);
    }
    
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 