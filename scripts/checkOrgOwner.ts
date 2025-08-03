import { ethers } from "hardhat";

async function main() {
  const contractAddress = "0x2BfeB9b810CD42C12018076031A548FB357517FC";
  const orgId = "0x18331B7b011d822F963236d0b6b8775Fb86fc1AF";
  
  const OrgFeedback = await ethers.getContractFactory("OrgFeedback");
  const contract = OrgFeedback.attach(contractAddress);
  
  console.log("🔍 Check Organization Owner");
  console.log("==========================");
  console.log(`Organization: ${orgId}`);
  console.log("");
  
  try {
    // Get organization metadata
    const orgMetadata = await contract.getOrgMetadata(orgId);
    console.log("📋 Organization Metadata:");
    console.log(`  Name: ${orgMetadata[0]}`);
    console.log(`  Description: ${orgMetadata[1]}`);
    console.log(`  Logo CID: ${orgMetadata[2]}`);
    console.log(`  Owner: ${orgMetadata[3]}`);
    console.log("");
    
    // Check if the orgId matches the owner
    const isOrgIdOwner = orgId.toLowerCase() === orgMetadata[3].toLowerCase();
    console.log("🔍 Owner Check:");
    console.log(`  Organization ID: ${orgId}`);
    console.log(`  Owner from metadata: ${orgMetadata[3]}`);
    console.log(`  Match: ${isOrgIdOwner ? '✅' : '❌'}`);
    console.log("");
    
    if (!isOrgIdOwner) {
      console.log("❌ ISSUE FOUND: Organization ID doesn't match the owner!");
      console.log("💡 This means the organization was created by a different address.");
      console.log("");
      console.log("🔧 Solutions:");
      console.log("1. Connect with the actual owner: " + orgMetadata[3]);
      console.log("2. Or create a new organization with the current address");
    } else {
      console.log("✅ Organization ID matches the owner - this should work!");
    }
    
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 