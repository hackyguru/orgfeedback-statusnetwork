import { ethers } from "hardhat";

async function main() {
  // Contract address
  const contractAddress = "0xAab9Feae724F7251c6FCB9632423af9133C64480";
  
  // Get the contract factory
  const OrgFeedback = await ethers.getContractFactory("OrgFeedback");
  
  // Connect to the deployed contract
  const orgFeedback = OrgFeedback.attach(contractAddress);
  
  try {
    console.log("=".repeat(60));
    console.log("🔍 OrgFeedback Contract Debug Information");
    console.log("=".repeat(60));
    console.log(`Contract Address: ${contractAddress}`);
    
    // Get basic stats
    const totalOrgs = await orgFeedback.totalOrganizations();
    const totalFeedbacks = await orgFeedback.getFeedbackCount();
    
    console.log(`\n📊 Basic Statistics:`);
    console.log(`- Total Organizations: ${totalOrgs.toString()}`);
    console.log(`- Total Feedbacks: ${totalFeedbacks.toString()}`);
    
    // Test with a sample address (you should replace this with your wallet address)
    const testAddress = "0xdcC5bA35614F40F75d07402d81784214CbE853a9"; // Replace with your address
    
    console.log(`\n🏢 Organizations for address: ${testAddress}`);
    try {
      const userOrgs = await orgFeedback.getOrganizationsByUser(testAddress);
      console.log(`- User Organizations: ${userOrgs.length} found`);
      userOrgs.forEach((orgId, index) => {
        console.log(`  ${index + 1}. ${orgId}`);
      });
    } catch (error) {
      console.log(`- Error getting user organizations: ${error.message}`);
    }
    
    console.log(`\n📨 Accessible Feedbacks for address: ${testAddress}`);
    try {
      const feedbackData = await orgFeedback.getAccessibleFeedbacks();
      console.log(`- Feedback data structure:`, {
        isArray: Array.isArray(feedbackData),
        length: feedbackData?.length || 0,
        type: typeof feedbackData
      });
      
      if (feedbackData && feedbackData.length === 5) {
        const [orgIds, senders, receivers, messages, timestamps] = feedbackData;
        console.log(`- Parsed arrays:`, {
          orgIds: orgIds?.length || 0,
          senders: senders?.length || 0,
          receivers: receivers?.length || 0,
          messages: messages?.length || 0,
          timestamps: timestamps?.length || 0
        });
        
        // Show detailed feedback data
        console.log(`\n📝 Detailed Feedback Data:`);
        for (let i = 0; i < orgIds.length; i++) {
          console.log(`  Feedback ${i + 1}:`);
          console.log(`    - Org ID: ${orgIds[i]}`);
          console.log(`    - Sender: ${senders[i]}`);
          console.log(`    - Receiver: ${receivers[i]}`);
          console.log(`    - Message Length: ${messages[i]?.length || 0} chars`);
          console.log(`    - Timestamp: ${timestamps[i]} (${new Date(Number(timestamps[i]) * 1000).toISOString()})`);
          console.log(`    - You are: ${
            senders[i].toLowerCase() === testAddress.toLowerCase() ? 'SENDER' :
            receivers[i].toLowerCase() === testAddress.toLowerCase() ? 'RECEIVER' :
            'ADMIN'
          }`);
        }
      }
    } catch (error) {
      console.log(`- Error getting accessible feedbacks: ${error.message}`);
    }
    
    console.log("\n" + "=".repeat(60));
    console.log("💡 Next Steps:");
    console.log("If frontend shows 0 accessible feedbacks but debug script shows some:");
    console.log("1. Check if frontend wallet address matches debug script address");
    console.log("2. Make sure MetaMask is on Status Testnet (Chain ID: 1660990954)");
    console.log("3. Verify you're using the same wallet account in both");
    console.log("4. Frontend should show 'Addresses identical: YES'");
    console.log("=".repeat(60));
    
  } catch (error) {
    console.error("❌ Error debugging contract:", error);
    process.exit(1);
  }
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });