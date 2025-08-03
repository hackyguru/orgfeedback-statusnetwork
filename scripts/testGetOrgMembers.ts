import { ethers } from "hardhat";
import { config } from "dotenv";

config();

async function main() {
  console.log("🔍 Test getOrgMembers Function");
  console.log("================================");

  const [signer] = await ethers.getSigners();
  console.log("Current signer address:", signer.address);

  const contractAddress = "0x2BfeB9b810CD42C12018076031A548FB357517FC";
  const orgId = "0x18331B7b011d822F963236d0b6b8775Fb86fc1AF";

  const contract = await ethers.getContractAt("OrgFeedback", contractAddress);

  try {
    console.log("\n📋 Testing getOrgMembers...");
    console.log("Organization ID:", orgId);
    console.log("Caller address:", signer.address);

    // First check if the signer is the owner
    const orgMetadata = await contract.getOrgMetadata(orgId);
    console.log("Organization owner:", orgMetadata[3]);
    console.log("Is caller the owner?", signer.address.toLowerCase() === orgMetadata[3].toLowerCase());

    // Check if signer is a member
    const isMember = await contract.isMember(orgId, signer.address);
    console.log("Is caller a member?", isMember);

    // Check if signer is a moderator
    const isModerator = await contract.isModerator(orgId, signer.address);
    console.log("Is caller a moderator?", isModerator);

    // Try to get members
    console.log("\n🔍 Attempting to call getOrgMembers...");
    const members = await contract.getOrgMembers(orgId);
    console.log("✅ Success! Members:", members);
    console.log("Number of members:", members.length);

  } catch (error) {
    console.log("❌ Error calling getOrgMembers:");
    console.log("Error message:", error.message);
    
    if (error.message.includes("Not org owner or moderator")) {
      console.log("\n💡 Analysis:");
      console.log("- The caller is not recognized as owner or moderator");
      console.log("- Make sure you're connected with the correct wallet");
      console.log("- The organization owner is:", orgId);
      console.log("- Your connected address is:", signer.address);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 