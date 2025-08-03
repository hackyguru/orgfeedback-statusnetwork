import { ethers } from "hardhat";

async function main() {
  const contractAddress = "0x4035a97483d7E7C5dE70c50B6CD7cDA494D4b79d";
  const orgId = "0xdcC5bA35614F40F75d07402d81784214CbE853a9";
  
  // Get the contract
  const OrgFeedback = await ethers.getContractFactory("OrgFeedback");
  const contract = OrgFeedback.attach(contractAddress);
  
  console.log("👥 Organization Members");
  console.log("=====================================");
  
  try {
    // Get organization info
    const orgMetadata = await contract.getOrgMetadata(orgId);
    console.log(`Organization: ${orgMetadata[0]}`);
    console.log(`Owner: ${orgMetadata[3]}`);
    console.log("");
    
    // Try to get members (this might fail if we're not a member)
    try {
      const members = await contract.getOrgMembers(orgId);
      console.log(`📋 Current Members (${members.length}):`);
      for (let i = 0; i < members.length; i++) {
        const member = members[i];
        const isOwner = member.toLowerCase() === orgMetadata[3].toLowerCase();
        const isModerator = await contract.isModerator(orgId, member);
        
        let role = "Member";
        if (isOwner) role = "Owner";
        else if (isModerator) role = "Moderator";
        
        console.log(`  ${i + 1}. ${member} (${role})`);
      }
    } catch (error) {
      console.log("❌ Cannot access member list (you might not be a member)");
      
      // Check specific addresses
      const addresses = [
        "0xdcC5bA35614F40F75d07402d81784214CbE853a9", // Owner
        "0x18331B7b011d822F963236d0b6b8775Fb86fc1AF", // Your address
        "0x2028A2a3f75E5f58cCE5C5Ceb1Db24542FaFDc1c"  // Target address
      ];
      
      console.log("\n🔍 Checking specific addresses:");
      for (const addr of addresses) {
        const isMember = await contract.isMember(orgId, addr);
        const isModerator = await contract.isModerator(orgId, addr);
        let status = "Not a member";
        if (isMember) {
          if (addr.toLowerCase() === orgMetadata[3].toLowerCase()) status = "Owner";
          else if (isModerator) status = "Moderator";
          else status = "Member";
        }
        console.log(`  ${addr}: ${status}`);
      }
    }
    
  } catch (error) {
    console.error("❌ Error:", error);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});