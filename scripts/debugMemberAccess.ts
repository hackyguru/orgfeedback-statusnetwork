import { ethers } from "hardhat";

async function main() {
  const contractAddress = "0x4035a97483d7E7C5dE70c50B6CD7cDA494D4b79d";
  const orgId = "0xdcC5bA35614F40F75d07402d81784214CbE853a9";
  
  // Get the contract
  const OrgFeedback = await ethers.getContractFactory("OrgFeedback");
  const contract = OrgFeedback.attach(contractAddress);
  
  console.log("🔍 Debugging Member Access Issue");
  console.log("=====================================");
  
  try {
    const [signer] = await ethers.getSigners();
    console.log(`Current signer: ${signer.address}`);
    console.log("");
    
    // Get organization metadata
    const orgMetadata = await contract.getOrgMetadata(orgId);
    console.log("✅ Organization Info:");
    console.log(`  Name: ${orgMetadata[0]}`);
    console.log(`  Description: ${orgMetadata[1]}`);
    console.log(`  Logo IPFS CID: ${orgMetadata[2]}`);
    console.log(`  Owner: ${orgMetadata[3]}`);
    console.log("");
    
    // Check signer's status
    const isOwner = signer.address.toLowerCase() === orgMetadata[3].toLowerCase();
    const isMember = await contract.isMember(orgId, signer.address);
    const isModerator = await contract.isModerator(orgId, signer.address);
    
    console.log("📋 Current Signer Status:");
    console.log(`  Is Owner: ${isOwner ? '✅ YES' : '❌ NO'}`);
    console.log(`  Is Member: ${isMember ? '✅ YES' : '❌ NO'}`);
    console.log(`  Is Moderator: ${isModerator ? '✅ YES' : '❌ NO'}`);
    console.log("");
    
    // Try to call getOrgMembers directly
    console.log("🔍 Testing getOrgMembers call:");
    try {
      const members = await contract.getOrgMembers(orgId);
      console.log(`✅ SUCCESS: Found ${members.length} members`);
      members.forEach((member: string, index: number) => {
        console.log(`  ${index + 1}. ${member}`);
      });
    } catch (error: any) {
      console.log(`❌ FAILED: ${error.message}`);
      
      // Check if it's the "Not a member" error
      if (error.message.includes("Not a member")) {
        console.log("   → This confirms the access control is working");
        console.log("   → Only members can call getOrgMembers");
      }
    }
    console.log("");
    
    // Test with owner account if we're not the owner
    if (!isOwner) {
      console.log("🔄 Trying to impersonate owner for testing...");
      try {
        const ownerSigner = await ethers.getImpersonatedSigner(orgMetadata[3]);
        const contractAsOwner = contract.connect(ownerSigner);
        
        const members = await contractAsOwner.getOrgMembers(orgId);
        console.log(`✅ SUCCESS as owner: Found ${members.length} members`);
        members.forEach((member: string, index: number) => {
          console.log(`  ${index + 1}. ${member}`);
        });
      } catch (error: any) {
        console.log(`❌ Could not impersonate owner: ${error.message}`);
      }
    }
    
    // Check specific addresses we know about
    console.log("🔍 Checking specific addresses:");
    const testAddresses = [
      orgMetadata[3], // Owner
      "0x2028A2a3f75E5f58cCE5C5Ceb1Db24542FaFDc1c", // Known member
      "0x18331B7b011d822F963236d0b6b8775Fb86fc1AF"  // Other address
    ];
    
    for (const addr of testAddresses) {
      const isMemberCheck = await contract.isMember(orgId, addr);
      const isModeratorCheck = await contract.isModerator(orgId, addr);
      console.log(`  ${addr}:`);
      console.log(`    Member: ${isMemberCheck ? '✅' : '❌'}`);
      console.log(`    Moderator: ${isModeratorCheck ? '✅' : '❌'}`);
    }
    
  } catch (error) {
    console.error("❌ Error:", error);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});