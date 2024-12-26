import Transfer from '../models/transfer.js';
import { PublicKey } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import TokenMetadataService from '../services/tokenMetadata.js'; // Ensure this import is correct
import config from '../config/config.js';
const { logger } = config;

class TransferHandler {
    constructor(connection) {
        this.connection = connection;
    }

    async handleTransfer(data) {
        try {
            const {
                signature,
                instructions,
                accounts,
                timestamp
            } = data;

            const transferInstructions = instructions.filter(ix => 
                ix.programId === TOKEN_PROGRAM_ID.toString() &&
                ix.data.instruction === 3
            );

            for (const ix of transferInstructions) {
                const mintAddress = accounts[3];  // Extract the mint address from accounts

                // Ensure mintAddress is defined before proceeding
                if (!mintAddress) {
                    logger.error('Mint address not found');
                    continue;  // Skip this transfer if mintAddress is not found
                }

                const isNFT = await this.isNFT(mintAddress);
                const tokenMetadata = TokenMetadataService.getTokenMetadata(mintAddress); // Get metadata for mintAddress

                const transfer = new Transfer({
                    signature,
                    tokenAddress: accounts[1],
                    fromAddress: accounts[0],
                    toAddress: accounts[2],
                    amount: ix.data.amount.toString(),
                    timestamp: new Date(timestamp * 1000),
                    tokenMint: mintAddress,
                    programId: ix.programId,
                    isNFT,
                    tokenMetadata
                });

                await transfer.save();
                logger.info(`Transfer saved: ${signature}`);
            }
        } catch (error) {
            logger.error('Error handling transfer:', error);
            throw error;
        }
    }

    async isNFT(mintAddress) {
        try {
            const mintInfo = await this.connection.getParsedAccountInfo(
                new PublicKey(mintAddress)
            );
            
            return mintInfo.value.data.parsed.info.supply === '1' &&
                   mintInfo.value.data.parsed.info.decimals === 0;
        } catch (error) {
            logger.error('Error checking NFT status:', error);
            return false;
        }
    }
}

export default TransferHandler;
