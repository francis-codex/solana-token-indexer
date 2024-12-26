import { Schema, model } from 'mongoose';

// Define the schema
const transferSchema = new Schema({
    signature: { 
        type: String, 
        required: true, 
        unique: true,
        index: true 
    },
    tokenAddress: { 
        type: String, 
        required: true,
        index: true 
    },
    fromAddress: { 
        type: String, 
        required: true,
        index: true 
    },
    toAddress: { 
        type: String, 
        required: true,
        index: true 
    },
    amount: { 
        type: String, 
        required: true 
    },
    timestamp: { 
        type: Date, 
        default: Date.now,
        index: true 
    },
    isNFT: { 
        type: Boolean, 
        default: false,
        index: true 
    },
    tokenMint: { 
        type: String, 
        required: true,
        index: true 
    },
    programId: { 
        type: String, 
        required: true 
    },
    tokenMetadata: {
        name: String,
        symbol: String,
        decimals: Number
    }
}, {
    timestamps: true
});

// Create the model
const Transfer = model('Transfer', transferSchema);

// Export the model as default and utility methods as named exports
export default Transfer;

// Named exports for additional methods
export const find = (...args) => Transfer.find(...args);
export const countDocuments = (...args) => Transfer.countDocuments(...args);
