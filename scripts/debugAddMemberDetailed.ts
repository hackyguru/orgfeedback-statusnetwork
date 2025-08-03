import { ethers } from "hardhat";

async function main() {
  const contractAddress = "0x4035a97483d7E7C5dE70c50B6CD7cDA494D4b79d";
  const orgId = "0xdcC5bA35614F40F75d07402d81784214CbE853a9";
  const targetAddress = "0x2028A2a3f75E5f58cCE5C5Ceb1Db24542FaFDc1c";
  
  const OrgFeedback = await ethers.getContractFactory("OrgFeedback");
  const contract = OrgFeedback.attach(contractAddress);
  
  console.log("🔍 Detailed AddMember Debug");
  console.log("============================");
  console.log(`Trying to add: ${targetAddress}`);
  console.log(`To organization: ${orgId}`);
  console.log("");
  
  try {
    // Check current status
    const isMember = await contract.isMember(orgId, targetAddress);
    const isModerator = await contract.isModerator(orgId, targetAddress);
    
    console.log("📋 Current Status:");
    console.log(`  Is Member: ${isMember ? '✅ YES' : '❌ NO'}`);
    console.log(`  Is Moderator: ${isModerator ? '✅ YES' : '❌ NO'}`);
    console.log("");
    
    if (isMember) {
      console.log("❌ ERROR EXPLANATION:");
      console.log("  The addMember function has this check:");
      console.log("  require(!organizations[orgId].members[member], \"Already a member\");");
      console.log("  ");
      console.log("  Since this address is already a member, the transaction fails!");
      console.log("");
      
      console.log("✅ WHAT YOU CAN DO:");
      if (isModerator) {
        console.log("  This address is already a MODERATOR (highest role)!");
        console.log("  They can:");
        console.log("  - Add/remove other members");
        console.log("  - View all feedback");
        console.log("  - See member lists");
        console.log("");
        console.log("  🎯 NO ACTION NEEDED - they're already fully set up!");
      } else {
        console.log("  This address is a member but not a moderator.");
        console.log("  You could promote them to moderator using 'Add Moderator'");
      }
    } else {
      console.log("✅ This address can be added as a member!");
    }
    
    console.log("");
    console.log("🎯 ALTERNATIVE ADDRESSES TO TRY:");
    const testAddresses = [
      "0x18331B7b011d822F963236d0b6b8775Fb86fc1AF",
      "0x742d35Cc6635C0532925a3b8D4e9F7c3A6b7e5A1", // Random example
      "0x1234567890123456789012345678901234567890"  // Another example
    ];
    
    for (const addr of testAddresses) {
      try {
        const isAddrMember = await contract.isMember(orgId, addr);
        console.log(`  ${addr}: ${isAddrMember ? '❌ Already member' : '✅ Can be added'}`);
      } catch (e) {
        console.log(`  ${addr}: ✅ Can be added`);
      }
    }
    
    console.log("");
    console.log("💡 RECOMMENDED ACTIONS:");
    console.log("1. Try adding 0x18331B7b011d822F963236d0b6b8775Fb86fc1AF (your other account)");
    console.log("2. Or connect with 0x2028A2a3f75E5f58cCE5C5Ceb1Db24542FaFDc1c to test moderator features");
    console.log("3. Or create a new wallet address to add as a member");
    
  } catch (error) {
    console.error("❌ Error:", error);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});