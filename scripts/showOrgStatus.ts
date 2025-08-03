import { ethers } from "hardhat";

async function main() {
  const contractAddress = "0x4035a97483d7E7C5dE70c50B6CD7cDA494D4b79d";
  const orgId = "0xdcC5bA35614F40F75d07402d81784214CbE853a9";
  
  const OrgFeedback = await ethers.getContractFactory("OrgFeedback");
  const contract = OrgFeedback.attach(contractAddress);
  
  console.log("👥 Current Organization Status");
  console.log("=====================================");
  
  try {
    const orgMetadata = await contract.getOrgMetadata(orgId);
    console.log(`Organization: ${orgMetadata[0]}`);
    console.log(`Owner: ${orgMetadata[3]}`);
    console.log("");
    
    const addresses = [
      { addr: "0xdcC5bA35614F40F75d07402d81784214CbE853a9", label: "Owner" },
      { addr: "0x2028A2a3f75E5f58cCE5C5Ceb1Db24542FaFDc1c", label: "Target Address" },
      { addr: "0x18331B7b011d822F963236d0b6b8775Fb86fc1AF", label: "Your Account" }
    ];
    
    console.log("📋 Address Status:");
    for (const { addr, label } of addresses) {
      const isMember = await contract.isMember(orgId, addr);
      const isModerator = await contract.isModerator(orgId, addr);
      
      let status = "Not a member";
      if (isMember) {
        if (addr.toLowerCase() === orgMetadata[3].toLowerCase()) {
          status = "Owner (can manage everything)";
        } else if (isModerator) {
          status = "Moderator (can manage members)";
        } else {
          status = "Member (can view/send feedback)";
        }
      }
      
      console.log(`  ${label}:`);
      console.log(`    ${addr}`);
      console.log(`    Status: ${status}`);
      console.log("");
    }
    
    console.log("🎯 Recommendations:");
    console.log("1. To add a new member: Use 0x18331B7b011d822F963236d0b6b8775Fb86fc1AF");
    console.log("2. 0x2028A2a3f75E5f58cCE5C5Ceb1Db24542FaFDc1c is already a moderator!");
    console.log("3. Connect with owner account to see member list in UI");
    
  } catch (error) {
    console.error("❌ Error:", error);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});