import { ethers } from "hardhat";
import { config } from "dotenv";

config();

async function main() {
  console.log("🔍 Debug Organization State");
  console.log("============================");

  const [signer] = await ethers.getSigners();
  console.log("Current signer address:", signer.address);

  const contractAddress = "0x2BfeB9b810CD42C12018076031A548FB357517FC";
  const orgId = "0x18331B7b011d822F963236d0b6b8775Fb86fc1AF";

  const contract = await ethers.getContractAt("OrgFeedback", contractAddress);

  try {
    console.log("\n📋 Organization State Check:");
    console.log("Organization ID:", orgId);
    console.log("Caller address:", signer.address);

    // Check if organization exists
    try {
      const orgMetadata = await contract.getOrgMetadata(orgId);
      console.log("✅ Organization exists");
      console.log("  Name:", orgMetadata[0]);
      console.log("  Description:", orgMetadata[1]);
      console.log("  Logo CID:", orgMetadata[2]);
      console.log("  Owner:", orgMetadata[3]);
    } catch (error) {
      console.log("❌ Organization does not exist or error:", error.message);
      return;
    }

    // Check if caller is owner
    const orgMetadata = await contract.getOrgMetadata(orgId);
    const isOwner = signer.address.toLowerCase() === orgMetadata[3].toLowerCase();
    console.log("\n👑 Owner Check:");
    console.log("  Organization owner:", orgMetadata[3]);
    console.log("  Caller is owner:", isOwner);

    // Check if caller is member
    const isMember = await contract.isMember(orgId, signer.address);
    console.log("\n👥 Member Check:");
    console.log("  Caller is member:", isMember);

    // Check if caller is moderator
    const isModerator = await contract.isModerator(orgId, signer.address);
    console.log("\n🛡️ Moderator Check:");
    console.log("  Caller is moderator:", isModerator);

    // Check onlyOrgOwnerOrModerator conditions
    console.log("\n🔍 Access Control Check:");
    console.log("  Condition 1 - Is owner:", isOwner);
    console.log("  Condition 2 - Is moderator:", isModerator);
    console.log("  Combined - Has access:", isOwner || isModerator);

    if (isOwner || isModerator) {
      console.log("\n🔍 Attempting getOrgMembers...");
      try {
        const members = await contract.getOrgMembers(orgId);
        console.log("✅ Success! Members:", members);
        console.log("Number of members:", members.length);
      } catch (error) {
        console.log("❌ getOrgMembers failed:", error.message);
      }
    } else {
      console.log("❌ Caller does not have access (not owner or moderator)");
    }

  } catch (error) {
    console.log("❌ Error during state check:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 