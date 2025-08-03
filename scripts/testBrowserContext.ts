import { ethers } from "hardhat";
import { config } from "dotenv";

config();

async function main() {
  console.log("🔍 Test Browser Context");
  console.log("=======================");

  const [signer] = await ethers.getSigners();
  console.log("Current signer address:", signer.address);

  const contractAddress = "0x2BfeB9b810CD42C12018076031A548FB357517FC";
  const orgId = "0x18331B7b011d822F963236d0b6b8775Fb86fc1AF";

  const contract = await ethers.getContractAt("OrgFeedback", contractAddress);

  try {
    console.log("\n📋 Testing with explicit account context...");
    console.log("Organization ID:", orgId);
    console.log("Caller address:", signer.address);
    console.log("Contract address:", contractAddress);

    // Test with explicit signer context
    const contractWithSigner = contract.connect(signer);
    
    console.log("\n🔍 Testing getOrgMembers with explicit signer...");
    const members = await contractWithSigner.getOrgMembers(orgId);
    console.log("✅ Success with explicit signer! Members:", members);
    console.log("Number of members:", members.length);

    // Test without explicit signer (like browser might be doing)
    console.log("\n🔍 Testing getOrgMembers without explicit signer...");
    const members2 = await contract.getOrgMembers(orgId);
    console.log("✅ Success without explicit signer! Members:", members2);
    console.log("Number of members:", members2.length);

    // Test with different account context
    console.log("\n🔍 Testing with different account context...");
    const provider = ethers.provider;
    const contractWithProvider = new ethers.Contract(contractAddress, contract.interface, provider);
    
    const members3 = await contractWithProvider.getOrgMembers(orgId);
    console.log("✅ Success with provider! Members:", members3);
    console.log("Number of members:", members3.length);

  } catch (error) {
    console.log("❌ Error during context test:");
    console.log("Error message:", error.message);
    
    if (error.message.includes("Not org owner or moderator")) {
      console.log("\n💡 Analysis:");
      console.log("- The caller context is not being recognized correctly");
      console.log("- This might be a signer/account mismatch issue");
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 