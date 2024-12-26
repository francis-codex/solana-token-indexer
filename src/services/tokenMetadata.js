import { TokenListProvider } from '@solana/spl-token-registry';
import config from '../config/config.js';
const { network, logger } = config;
class TokenMetadataService {
    constructor() {
        this.tokenList = new Map();
        this.initializeTokenList();
    }

    async initializeTokenList() {
        try {
            const tokens = await new TokenListProvider().resolve();
            const tokenList = tokens.filterByClusterSlug('mainnet-beta').getList();
            
            tokenList.forEach(token => {
                this.tokenList.set(token.address, {
                    name: token.name,
                    symbol: token.symbol,
                    decimals: token.decimals
                });
            });
            
            logger.info('Token list initialized');
        } catch (error) {
            logger.error('Error initializing token list:', error);
        }
    }

    getTokenMetadata(mintAddress) {
        return this.tokenList.get(mintAddress) || null;
    }
}

export default new TokenMetadataService();