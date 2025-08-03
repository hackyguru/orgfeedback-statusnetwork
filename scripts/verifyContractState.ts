import { ethers } from "hardhat";
import { config } from "dotenv";

config();

async function main() {
  console.log("🔍 Verify Contract State");
  console.log("========================");

  const [signer] = await ethers.getSigners();
  console.log("Current signer address:", signer.address);

  const contractAddress = "0x2BfeB9b810CD42C12018076031A548FB357517FC";
  const orgId = "0x18331B7b011d822F963236d0b6b8775Fb86fc1AF";

  const contract = await ethers.getContractAt("OrgFeedback", contractAddress);

  try {
    console.log("\n📋 Contract State Verification:");
    console.log("Contract address:", contractAddress);
    console.log("Organization ID:", orgId);
    console.log("Caller address:", signer.address);

    // Check if organization exists
    console.log("\n🔍 Checking organization existence...");
    try {
      const orgMetadata = await contract.getOrgMetadata(orgId);
      console.log("✅ Organization exists:");
      console.log("  Name:", orgMetadata[0]);
      console.log("  Description:", orgMetadata[1]);
      console.log("  Logo CID:", orgMetadata[2]);
      console.log("  Owner:", orgMetadata[3]);
    } catch (error) {
      console.log("❌ Organization does not exist:", error.message);
      return;
    }

    // Check caller's roles
    console.log("\n🔍 Checking caller roles...");
    const isMember = await contract.isMember(orgId, signer.address);
    const isModerator = await contract.isModerator(orgId, signer.address);
    const orgMetadata = await contract.getOrgMetadata(orgId);
    const isOwner = signer.address.toLowerCase() === orgMetadata[3].toLowerCase();

    console.log("  Is member:", isMember);
    console.log("  Is moderator:", isModerator);
    console.log("  Is owner:", isOwner);

    // Test getOrgMembers with different approaches
    console.log("\n🔍 Testing getOrgMembers...");
    
    if (isOwner || isModerator) {
      try {
        const members = await contract.getOrgMembers(orgId);
        console.log("✅ getOrgMembers works:", members);
        console.log("Number of members:", members.length);
      } catch (error) {
        console.log("❌ getOrgMembers failed:", error.message);
      }
    } else {
      console.log("❌ Caller does not have access");
    }

    // Test the exact same call that browser makes
    console.log("\n🔍 Testing exact browser call...");
    try {
      const members = await contract.getOrgMembers(orgId);
      console.log("✅ Browser-style call works:", members);
    } catch (error) {
      console.log("❌ Browser-style call failed:", error.message);
    }

  } catch (error) {
    console.log("❌ Error during verification:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 