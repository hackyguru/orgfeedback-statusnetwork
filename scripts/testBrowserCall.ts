import { ethers } from "hardhat";
import { config } from "dotenv";

config();

async function main() {
  console.log("🔍 Test Browser-Style Call");
  console.log("============================");

  const [signer] = await ethers.getSigners();
  console.log("Current signer address:", signer.address);

  const contractAddress = "0x2BfeB9b810CD42C12018076031A548FB357517FC";
  const orgId = "0x18331B7b011d822F963236d0b6b8775Fb86fc1AF";

  const contract = await ethers.getContractAt("OrgFeedback", contractAddress);

  try {
    console.log("\n📋 Simulating browser call...");
    console.log("Organization ID:", orgId);
    console.log("Caller address:", signer.address);
    console.log("Contract address:", contractAddress);

    // Simulate the exact browser call
    console.log("\n🔍 Making direct getOrgMembers call...");
    const members = await contract.getOrgMembers(orgId);
    console.log("✅ Success! Members:", members);
    console.log("Number of members:", members.length);

  } catch (error) {
    console.log("❌ Error calling getOrgMembers:");
    console.log("Error message:", error.message);
    
    if (error.message.includes("Not org owner or moderator")) {
      console.log("\n💡 Analysis:");
      console.log("- The caller is not recognized as owner or moderator");
      console.log("- This suggests a network/RPC issue");
      console.log("- Browser and Hardhat might be using different networks");
    }
  }

  // Also test with a different approach - check if we can read other functions
  try {
    console.log("\n🔍 Testing other contract functions...");
    
    // Test getOrgMetadata
    const metadata = await contract.getOrgMetadata(orgId);
    console.log("✅ getOrgMetadata works:", metadata);
    
    // Test isMember
    const isMember = await contract.isMember(orgId, signer.address);
    console.log("✅ isMember works:", isMember);
    
    // Test isModerator
    const isModerator = await contract.isModerator(orgId, signer.address);
    console.log("✅ isModerator works:", isModerator);
    
  } catch (error) {
    console.log("❌ Other functions also failed:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 