import WebSocket from 'ws';
import { Connection } from '@solana/web3.js';
import config from '../config/config.js';
const { quicknode, network: _network, logger } = config;

import TransferHandler from '../handlers/transferHandler.js';

class QuickNodeService {
    constructor() {
        // Explicitly use the HTTPS endpoint
        const httpsEndpoint = config.quicknode.httpsEndpoint;

        // Validate the HTTPS endpoint
        if (!httpsEndpoint) {
            throw new Error('HTTPS endpoint is not defined in the configuration');
        }

        if (!httpsEndpoint.startsWith('https://')) {
            throw new Error(`Invalid endpoint: ${httpsEndpoint}. Must start with https://`);
        }

        // Log the endpoints for debugging
        logger.info(`Using WSS Endpoint: ${quicknode.endpoint}`);
        logger.info(`Using HTTPS Endpoint: ${httpsEndpoint}`);
        
        // Create Connection with explicit HTTPS endpoint
        this.connection = new Connection(httpsEndpoint, 'confirmed');
        this.transferHandler = new TransferHandler(this.connection);
        this.retryCount = 0;
        this.maxRetries = 5;
        this.ws = null;
    }

    async initializeStream() {
        try {
            // Create WebSocket connection
            this.ws = new WebSocket(quicknode.endpoint);

            // Subscribe to token program and metadata program
            const subscribeMessage = {
                jsonrpc: "2.0",
                id: 1,
                method: "logsSubscribe",
                params: [
                    {
                        mentions: [
                            "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
                            "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
                        ]
                    },
                    {
                        commitment: "confirmed"
                    }
                ]
            };

            this.ws.on('open', () => {
                logger.info('WebSocket connection established');
                this.ws.send(JSON.stringify(subscribeMessage));
            });

            this.ws.on('message', async (data) => {
                try {
                    const parsed = JSON.parse(data.toString());
                    if (parsed.method === 'logsNotification') {
                        await this.transferHandler.handleTransfer(parsed.params.result);
                    }
                    this.retryCount = 0;
                } catch (error) {
                    logger.error('Error processing message:', error);
                }
            });

            this.ws.on('error', async (error) => {
                logger.error('WebSocket error:', error);
                if (this.retryCount < this.maxRetries) {
                    this.retryCount++;
                    logger.info(`Retrying connection. Attempt ${this.retryCount}`);
                    await this.reconnect();
                }
            });

            this.ws.on('close', async () => {
                logger.info('WebSocket connection closed');
                if (this.retryCount < this.maxRetries) {
                    this.retryCount++;
                    logger.info(`Attempting to reconnect. Attempt ${this.retryCount}`);
                    await this.reconnect();
                }
            });

            logger.info('QuickNode stream initialized successfully');
            return this.ws;
        } catch (error) {
            logger.error('Error initializing stream:', error);
            throw error;
        }
    }

    async reconnect() {
        try {
            // Close existing connection if any
            if (this.ws) {
                this.ws.terminate();
            }
            
            // Wait before attempting to reconnect
            await new Promise(resolve => setTimeout(resolve, 5000 * this.retryCount));
            await this.initializeStream();
        } catch (error) {
            logger.error('Reconnection failed:', error);
        }
    }

    async cleanup() {
        if (this.ws) {
            this.ws.terminate();
        }
    }
}

export default new QuickNodeService();