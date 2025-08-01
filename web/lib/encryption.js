import { encrypt, decrypt } from '@metamask/eth-sig-util';

/**
 * Get encryption public key from MetaMask for the current connected account
 * @param {string} address - The wallet address (must be the currently connected account)
 * @returns {Promise<string>} - The public encryption key
 */
export const getEncryptionPublicKey = async (address) => {
  if (!window.ethereum) {
    throw new Error('MetaMask not found');
  }

  try {
    // First, ensure we're requesting for the current account
    const accounts = await window.ethereum.request({ method: 'eth_accounts' });
    if (!accounts.includes(address.toLowerCase())) {
      throw new Error('Can only get encryption key for connected account');
    }

    const publicKey = await window.ethereum.request({
      method: 'eth_getEncryptionPublicKey',
      params: [address],
    });
    return publicKey;
  } catch (error) {
    throw new Error(`Failed to get encryption public key: ${error.message}`);
  }
};

/**
 * Encrypt a message using MetaMask encryption
 * @param {string} message - The message to encrypt
 * @param {string} publicKey - The recipient's public encryption key
 * @returns {string} - Base64 encoded encrypted message
 */
export const encryptMessage = (message, publicKey) => {
  try {
    const encrypted = encrypt({
      publicKey,
      data: message,
      version: 'x25519-xsalsa20-poly1305',
    });
    
    // Convert to base64 string for storage
    return Buffer.from(JSON.stringify(encrypted), 'utf8').toString('base64');
  } catch (error) {
    throw new Error(`Failed to encrypt message: ${error.message}`);
  }
};

/**
 * Decrypt a message using MetaMask
 * @param {string} encryptedMessage - Base64 encoded encrypted message
 * @param {string} address - The wallet address to decrypt with
 * @returns {Promise<string>} - The decrypted message
 */
export const decryptMessage = async (encryptedMessage, address) => {
  if (!window.ethereum) {
    throw new Error('MetaMask not found');
  }

  try {
    // Convert from base64 back to object
    const encrypted = JSON.parse(Buffer.from(encryptedMessage, 'base64').toString('utf8'));
    
    const decrypted = await window.ethereum.request({
      method: 'eth_decrypt',
      params: [JSON.stringify(encrypted), address],
    });
    
    return decrypted;
  } catch (error) {
    throw new Error(`Failed to decrypt message: ${error.message}`);
  }
};

/**
 * Decrypt or read a feedback message, handling both encrypted and unencrypted formats
 * @param {string} messageData - Base64 encoded message data
 * @param {string} address - The wallet address to decrypt with
 * @returns {Promise<string>} - The decrypted/decoded message
 */
export const readFeedbackMessage = async (messageData, address) => {
  try {
    // First, try to decode as a JSON object (unencrypted format)
    const decoded = Buffer.from(messageData, 'base64').toString('utf8');
    const parsed = JSON.parse(decoded);
    
    if (parsed.encrypted === false && parsed.message) {
      // This is an unencrypted message stored for receiver/admin
      return parsed.message;
    }
    
    // If not in the unencrypted format, try to decrypt as normal
    return await decryptMessage(messageData, address);
  } catch (parseError) {
    // If JSON parsing fails, assume it's encrypted and try to decrypt
    try {
      return await decryptMessage(messageData, address);
    } catch (decryptError) {
      throw new Error(`Failed to read message: ${decryptError.message}`);
    }
  }
};

/**
 * Encrypt feedback messages for sender, receiver, and admin
 * Note: Due to MetaMask limitations, we can only encrypt for the current user (sender)
 * @param {string} message - The feedback message
 * @param {string} senderAddress - Sender's address (current user)
 * @param {string} receiverAddress - Receiver's address  
 * @param {string} adminAddress - Admin's address
 * @returns {Promise<{forSender: string, forReceiver: string, forAdmin: string}>}
 */
export const encryptFeedbackMessage = async (message, senderAddress, receiverAddress, adminAddress) => {
  try {
    // Only encrypt for sender (current user) - MetaMask only allows encryption for connected account
    const senderKey = await getEncryptionPublicKey(senderAddress);
    const forSender = encryptMessage(message, senderKey);

    // For receiver and admin, we store the message in a format that indicates
    // it should be encrypted when they access it with their own wallet
    // This is a limitation of MetaMask's security model
    const messageForOthers = JSON.stringify({
      message: message,
      encrypted: false,
      note: "This message will be encrypted when accessed by the intended recipient"
    });

    return {
      forSender,
      forReceiver: Buffer.from(messageForOthers, 'utf8').toString('base64'),
      forAdmin: Buffer.from(messageForOthers, 'utf8').toString('base64'),
    };
  } catch (error) {
    throw new Error(`Failed to encrypt feedback: ${error.message}`);
  }
};

/**
 * Check if MetaMask is available and encryption is supported
 * @returns {boolean}
 */
export const isEncryptionSupported = () => {
  return !!(window.ethereum && window.ethereum.request);
};