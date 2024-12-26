import express, { json } from 'express';
import { connect } from 'mongoose';
import config from './config/config.js';
import quickNodeService from './services/quicknode.js';
import { find, countDocuments } from './models/transfer.js';

const { logger, mongodb, port } = config;

// Initialize Express
const app = express();
app.use(json());

// Connect to MongoDB
connect(mongodb.uri)
    .then(() => logger.info('Connected to MongoDB'))
    .catch(err => logger.error('MongoDB connection error:', err));

// Initialize QuickNode stream
quickNodeService.initializeStream()
    .then(() => logger.info('QuickNode stream initialized'))
    .catch(err => logger.error('QuickNode stream error:', err));

// API Routes
app.get('/health', (req, res) => {
    res.json({ status: 'healthy' });
});

app.get('/transfers', async (req, res) => {
    try {
        const { 
            page = 1, 
            limit = 10, 
            tokenAddress,
            fromAddress,
            toAddress,
            isNFT
        } = req.query;

        const query = {};
        if (tokenAddress) query.tokenAddress = tokenAddress;
        if (fromAddress) query.fromAddress = fromAddress;
        if (toAddress) query.toAddress = toAddress;
        if (isNFT !== undefined) query.isNFT = isNFT === 'true';

        const transfers = await find(query)
            .sort({ timestamp: -1 })
            .limit(Number(limit))
            .skip((Number(page) - 1) * Number(limit));

        const total = await countDocuments(query);

        res.json({
            transfers,
            totalPages: Math.ceil(total / limit),
            currentPage: Number(page),
            total
        });
    } catch (error) {
        logger.error('Error fetching transfers:', error);
        res.status(500).json({ error: error.message });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    logger.error('Unhandled error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(port, () => {
    logger.info(`Server running on port ${port}`);
});