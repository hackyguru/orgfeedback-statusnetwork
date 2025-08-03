import { ethers } from "hardhat";

async function main() {
  const contractAddress = "0x2BfeB9b810CD42C12018076031A548FB357517FC";
  const orgId = "0x18331B7b011d822F963236d0b6b8775Fb86fc1AF";
  const targetAddress = "0x2028A2a3f75E5f58cCE5C5Ceb1Db24542FaFDc1c";
  
  const OrgFeedback = await ethers.getContractFactory("OrgFeedback");
  const contract = OrgFeedback.attach(contractAddress);
  
  console.log("🧪 Testing addMember Error Handling");
  console.log("===================================");
  console.log(`Contract: ${contractAddress}`);
  console.log(`Organization: ${orgId}`);
  console.log(`Target Address: ${targetAddress}`);
  console.log("");
  
  try {
    // First check if the address is already a member
    const isMember = await contract.isMember(orgId, targetAddress);
    console.log(`Is already a member: ${isMember ? '✅' : '❌'}`);
    
    if (isMember) {
      console.log("❌ Address is already a member - this should cause the revert");
      console.log("");
      
      // Now try to add the member (this should fail)
      console.log("📝 Attempting to add member (should fail)...");
      try {
        const tx = await contract.addMember(orgId, targetAddress);
        console.log("❌ Unexpected success - this should have failed!");
        console.log(`Transaction: ${tx.hash}`);
      } catch (error) {
        console.log("✅ Expected error caught:");
        console.log(`  Error type: ${typeof error}`);
        console.log(`  Error message: ${error.message}`);
        console.log(`  Error details: ${error.details || 'N/A'}`);
        console.log(`  Error reason: ${error.reason || 'N/A'}`);
        console.log(`  Error data: ${error.data || 'N/A'}`);
        console.log(`  Full error:`, error);
        
        // Test our error parsing function
        const parseContractError = (error) => {
          if (!error) return 'Unknown error occurred';
          
          console.log('🔍 Raw error object:', error);
          console.log('🔍 Error type:', typeof error);
          console.log('🔍 Error keys:', Object.keys(error));
          
          let errorMessage = '';
          
          // Handle different error object structures
          if (error.message) {
            errorMessage = error.message;
          } else if (error.details) {
            errorMessage = error.details;
          } else if (error.reason) {
            errorMessage = error.reason;
          } else if (typeof error === 'string') {
            errorMessage = error;
          } else {
            errorMessage = error.toString();
          }
          
          console.log('🔍 Parsed error message:', errorMessage);
          
          // Common smart contract error patterns
          if (errorMessage.includes('Already a member')) {
            return 'This address is already a member of the organization';
          }
          if (errorMessage.includes('Not a member')) {
            return 'This address is not a member of the organization';
          }
          if (errorMessage.includes('Must be a member first')) {
            return 'Address must be a member before becoming a moderator';
          }
          if (errorMessage.includes('Already a moderator')) {
            return 'This address is already a moderator';
          }
          if (errorMessage.includes('Not a moderator')) {
            return 'This address is not a moderator';
          }
          if (errorMessage.includes('Not org owner')) {
            return 'Only the organization owner can perform this action';
          }
          if (errorMessage.includes('Not org owner or moderator')) {
            return 'Only owners and moderators can perform this action';
          }
          if (errorMessage.includes('Cannot remove owner')) {
            return 'Cannot remove the organization owner';
          }
          if (errorMessage.includes('Org does not exist')) {
            return 'Organization does not exist';
          }
          if (errorMessage.includes('You already own an org')) {
            return 'You already own an organization';
          }
          if (errorMessage.includes('execution reverted')) {
            // Try to extract the actual error message from the revert
            const match = errorMessage.match(/execution reverted: (.+)/);
            if (match && match[1]) {
              return match[1];
            }
            return 'Transaction failed - please check your input and try again';
          }
          if (errorMessage.includes('Internal JSON-RPC error')) {
            // This is a generic error, try to get more specific info
            if (error.data) {
              console.log('🔍 Error data:', error.data);
            }
            if (error.error) {
              console.log('🔍 Nested error:', error.error);
            }
            return 'Transaction failed - the address may already be a member or you may not have permission';
          }
          
          return `Transaction failed: ${errorMessage}`;
        };
        
        const parsedError = parseContractError(error);
        console.log("");
        console.log("🎯 Parsed error message:");
        console.log(`  ${parsedError}`);
        
      }
    } else {
      console.log("✅ Address is not a member - this should work");
    }
    
  } catch (error) {
    console.error("❌ Unexpected error:", error.message);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 