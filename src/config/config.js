import dotenv from 'dotenv';
import { createLogger, format as _format, transports as _transports } from 'winston';
import express from 'express';

// Load environment variables
dotenv.config();

// Configure the logger
const logger = createLogger({
    level: 'info',
    format: _format.combine(
        _format.timestamp(),
        _format.json()
    ),
    transports: [
        new _transports.File({ filename: 'error.log', level: 'error' }),
        new _transports.File({ filename: 'combined.log' }),
        new _transports.Console({
            format: _format.combine(
                _format.colorize(),
                _format.simple()
            )
        })
    ]
});

// Validate required environment variables
const requiredVars = [
    'QUICKNODE_WSS_ENDPOINT',
    'QUICKNODE_HTTPS_ENDPOINT',
    'MONGODB_URI',
    'PORT'
];

try {
    requiredVars.forEach(varName => {
        if (!process.env[varName]) {
            throw new Error(`Missing required environment variable: ${varName}`);
        }
    });
} catch (error) {
    logger.error('Configuration error:', error);
    process.exit(1);
}

// Server configuration
const serverConfig = {
    port: parseInt(process.env.PORT, 10) || 3000,
    cors: {
        origin: process.env.CORS_ORIGIN || '*',
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization']
    },
    rateLimit: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100 // limit each IP to 100 requests per windowMs
    }
};

// Database configuration
const dbConfig = {
    uri: process.env.MONGODB_URI,
    options: {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
    }
};

// QuickNode configuration
const quicknodeConfig = {
    endpoint: process.env.QUICKNODE_WSS_ENDPOINT.trim(),
    httpsEndpoint: process.env.QUICKNODE_HTTPS_ENDPOINT.trim(),
    apiKey: process.env.QUICKNODE_API_KEY,
    reconnectInterval: 5000,
    maxReconnectAttempts: 5
};

// Network configuration
const networkConfig = {
    environment: process.env.NODE_ENV || 'development',
    solanaNetwork: process.env.SOLANA_NETWORK || 'mainnet-beta'
};

// Export configuration
export default {
    server: serverConfig,
    mongodb: dbConfig,
    quicknode: quicknodeConfig,
    network: networkConfig,
    logger,
    
    // Backward compatibility for existing code
    port: serverConfig.port
};

// Add error handling for uncaught exceptions and unhandled rejections
process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception:', error);
    // Allow the process to gracefully terminate
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
    // Don't exit the process here, just log the error
});