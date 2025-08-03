import { ethers } from "hardhat";

async function main() {
  // Contract address
  const contractAddress = "0x2BfeB9b810CD42C12018076031A548FB357517FC";
  
  // Get the contract factory
  const OrgFeedback = await ethers.getContractFactory("OrgFeedback");
  
  // Connect to the deployed contract
  const orgFeedback = OrgFeedback.attach(contractAddress);
  
  try {
    console.log("=".repeat(60));
    console.log("🧪 Testing Feedback Retrieval");
    console.log("=".repeat(60));
    console.log(`Contract Address: ${contractAddress}`);
    
    // Test with the address that should have access
    const testAddress = "0xdcC5bA35614F40F75d07402d81784214CbE853a9";
    
    console.log(`\n🔍 Testing with address: ${testAddress}`);
    
    // Get user's organizations
    console.log("\n1. Getting user organizations...");
    const userOrgs = await orgFeedback.getOrganizationsByUser(testAddress);
    console.log(`✅ Found ${userOrgs.length} organizations:`, userOrgs);
    
    // Get accessible feedbacks
    console.log("\n2. Getting accessible feedbacks...");
    const feedbackData = await orgFeedback.getAccessibleFeedbacks();
    console.log(`✅ Raw feedback data:`, feedbackData);
    
    if (feedbackData && feedbackData.length === 5) {
      const [orgIds, senders, receivers, messages, timestamps] = feedbackData;
      console.log(`\n📊 Parsed feedback data:`);
      console.log(`- Organization IDs: ${orgIds.length} items`);
      console.log(`- Senders: ${senders.length} items`);
      console.log(`- Receivers: ${receivers.length} items`);
      console.log(`- Messages: ${messages.length} items`);
      console.log(`- Timestamps: ${timestamps.length} items`);
      
      // Show each feedback
      for (let i = 0; i < orgIds.length; i++) {
        console.log(`\n📝 Feedback ${i + 1}:`);
        console.log(`  - Org ID: ${orgIds[i]}`);
        console.log(`  - Sender: ${senders[i]}`);
        console.log(`  - Receiver: ${receivers[i]}`);
        console.log(`  - Message: "${messages[i]}"`);
        console.log(`  - Timestamp: ${timestamps[i]} (${new Date(Number(timestamps[i]) * 1000).toISOString()})`);
        
        // Check user's role
        const isSender = senders[i].toLowerCase() === testAddress.toLowerCase();
        const isReceiver = receivers[i].toLowerCase() === testAddress.toLowerCase();
        const isAdmin = !isSender && !isReceiver;
        
        console.log(`  - User role: ${isSender ? 'SENDER' : isReceiver ? 'RECEIVER' : 'ADMIN'}`);
      }
    } else {
      console.log("❌ Unexpected feedback data structure:", feedbackData);
    }
    
    console.log("\n" + "=".repeat(60));
    console.log("✅ Test completed successfully!");
    console.log("=".repeat(60));
    
  } catch (error) {
    console.error("❌ Error testing feedback retrieval:", error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 