# solana-token-indexer

A Node.js service that indexes SPL token transfers on Solana and serves them over an API.

- **Ingest:** transfers come in through QuickNode (`src/services/quicknode.js`) and are handled in `src/handlers/transferHandler.js`.
- **Enrich:** token names and symbols are looked up in `src/services/tokenMetadata.js`.
- **Store:** transfers are saved to MongoDB with Mongoose (`src/models/transfer.js`).
- **Serve:** an Express API with CORS and rate limiting (`src/index.js`).

## Run

Create a `.env` with your QuickNode endpoint and MongoDB connection string (see `src/config/config.js` for the exact names), then:

```bash
npm install
npm run dev
```

Stack: Node.js, Express, MongoDB, `@solana/web3.js`, `@solana/spl-token`, QuickNode SDK.
