import { ethers } from "hardhat";

async function main() {
  // Contract address
  const contractAddress = "0x2BfeB9b810CD42C12018076031A548FB357517FC";
  
  // Get the contract factory
  const OrgFeedback = await ethers.getContractFactory("OrgFeedback");
  
  // Connect to the deployed contract with signer
  const [signer] = await ethers.getSigners();
  const orgFeedback = OrgFeedback.attach(contractAddress).connect(signer);
  
  try {
    console.log("=".repeat(60));
    console.log("📝 Creating Test Feedback");
    console.log("=".repeat(60));
    console.log(`Contract Address: ${contractAddress}`);
    console.log(`Signer Address: ${signer.address}`);
    
    // Get user's organizations
    console.log("\n1. Getting user organizations...");
    const userOrgs = await orgFeedback.getOrganizationsByUser(signer.address);
    console.log(`✅ Found ${userOrgs.length} organizations:`, userOrgs);
    
    if (userOrgs.length === 0) {
      console.log("❌ No organizations found for this address. Please create an organization first.");
      return;
    }
    
    // Use the first organization
    const orgId = userOrgs[0];
    console.log(`\n2. Using organization: ${orgId}`);
    
    // Create a test feedback
    const receiverAddress = signer.address; // Send to self for testing
    const message = "This is a test feedback message created by the script";
    const revealToReceiver = true;
    const revealToAdmin = true;
    
    console.log(`\n3. Creating feedback:`);
    console.log(`  - Organization: ${orgId}`);
    console.log(`  - Receiver: ${receiverAddress}`);
    console.log(`  - Message: "${message}"`);
    console.log(`  - Reveal to receiver: ${revealToReceiver}`);
    console.log(`  - Reveal to admin: ${revealToAdmin}`);
    
    // Send the feedback
    console.log("\n4. Sending feedback transaction...");
    const tx = await orgFeedback.sendFeedback(
      orgId,
      receiverAddress,
      message,
      message, // Same message for sender
      message, // Same message for receiver
      revealToReceiver,
      revealToAdmin
    );
    
    console.log(`✅ Transaction sent: ${tx.hash}`);
    console.log("⏳ Waiting for confirmation...");
    
    const receipt = await tx.wait();
    console.log(`✅ Transaction confirmed in block ${receipt.blockNumber}`);
    
    console.log("\n" + "=".repeat(60));
    console.log("🎉 Test feedback created successfully!");
    console.log("Now you can check the feedback page to see this feedback.");
    console.log("=".repeat(60));
    
  } catch (error) {
    console.error("❌ Error creating test feedback:", error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 