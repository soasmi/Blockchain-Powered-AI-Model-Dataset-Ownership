# AI Asset Marketplace

A blockchain-powered platform that enables secure transfer, ownership, and monetization of AI models, scripts, and datasets. Built with a GitHub-inspired interface where every asset is minted as a unique, tradable digital asset on the blockchain.

## 🌟 Features

### Core Functionality
- **Blockchain Asset Minting**: Every AI model, script, and dataset is minted as a unique NFT
- **Instant Trading**: Trustless transactions with smart contract automation
- **Royalty System**: Creators earn ongoing royalties from their AI creations
- **Version Control**: Transparent version history with on-chain tracking
- **Licensing System**: Flexible licensing options (Commercial, Non-commercial, Research, Custom)
- **IPFS Storage**: Decentralized storage for all assets and metadata

### Marketplace Features
- **Fixed Price & Auction Orders**: Multiple selling mechanisms
- **Bidding System**: Competitive bidding for valuable assets
- **Search & Discovery**: Advanced filtering and search capabilities
- **User Profiles**: GitHub-inspired user profiles and asset galleries
- **Real-time Notifications**: Transaction and activity updates

### Technical Features
- **Smart Contracts**: Ethereum-based smart contracts for asset management
- **Web3 Integration**: Wallet connection and transaction management
- **Responsive Design**: Modern, mobile-first UI/UX
- **API-First Architecture**: RESTful API with comprehensive endpoints
- **Database Integration**: PostgreSQL with Prisma ORM

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend API   │    │   Blockchain    │
│   (Next.js)     │◄──►│   (Express)     │◄──►│   (Ethereum)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   IPFS Storage  │    │   PostgreSQL    │    │   Smart         │
│   (Decentralized)│    │   Database      │    │   Contracts     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- PostgreSQL 14+
- Git
- MetaMask or compatible Web3 wallet

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/your-username/ai-asset-marketplace.git
cd ai-asset-marketplace
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
# Copy environment files
cp .env.example .env
cp contracts/.env.example contracts/.env
cp frontend/.env.example frontend/.env
cp backend/.env.example backend/.env
```

4. **Configure environment variables**
```bash
# .env (root)
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:3001

# contracts/.env
PRIVATE_KEY=your_private_key_here
SEPOLIA_URL=https://sepolia.infura.io/v3/your_project_id
MAINNET_URL=https://mainnet.infura.io/v3/your_project_id

# frontend/.env.local
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=your_project_id
NEXT_PUBLIC_IPFS_GATEWAY=https://ipfs.io/ipfs/

# backend/.env
DATABASE_URL="postgresql://username:password@localhost:5432/ai_asset_marketplace"
BLOCKCHAIN_RPC_URL=http://localhost:8545
CONTRACT_ADDRESSES='{"AIAssetNFT":"0x...","Marketplace":"0x...","LicenseManager":"0x..."}'
IPFS_URL=https://ipfs.infura.io:5001/api/v0
IPFS_AUTH=your_ipfs_auth_here
JWT_SECRET=your_jwt_secret_here
```

5. **Set up the database**
```bash
cd backend
npx prisma migrate dev
npx prisma generate
npx prisma db seed
```

6. **Deploy smart contracts**
```bash
cd contracts
npm install
npx hardhat compile
npx hardhat node  # In a separate terminal
npx hardhat run scripts/deploy.js --network localhost
```

7. **Start the development servers**
```bash
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Frontend
cd frontend
npm run dev
```

8. **Access the application**
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- API Documentation: http://localhost:3001/api-docs

## 📁 Project Structure

```
ai-asset-marketplace/
├── contracts/                 # Smart contracts
│   ├── contracts/
│   │   ├── AIAssetNFT.sol    # Main NFT contract
│   │   ├── Marketplace.sol   # Trading marketplace
│   │   └── LicenseManager.sol # Licensing system
│   ├── scripts/
│   │   └── deploy.js         # Deployment script
│   └── test/                 # Contract tests
├── frontend/                 # Next.js frontend
│   ├── app/                  # App router pages
│   ├── components/           # React components
│   ├── lib/                  # Utilities
│   └── public/               # Static assets
├── backend/                  # Express.js backend
│   ├── src/
│   │   ├── routes/           # API routes
│   │   ├── services/         # Business logic
│   │   ├── middleware/       # Express middleware
│   │   └── utils/            # Utilities
│   └── prisma/               # Database schema
└── docs/                     # Documentation
```

## 🔧 Smart Contracts

### AIAssetNFT.sol
- **Purpose**: Core NFT contract for AI assets
- **Features**: 
  - Asset minting with metadata
  - Version control and history
  - Royalty system
  - Ownership transfer

### Marketplace.sol
- **Purpose**: Trading and auction system
- **Features**:
  - Fixed price orders
  - Auction orders with bidding
  - Order management
  - Transaction execution

### LicenseManager.sol
- **Purpose**: Licensing and usage tracking
- **Features**:
  - Multiple license types
  - Usage recording
  - License validation
  - Revenue sharing

## 🎨 Frontend Components

### Key Components
- **Header**: Navigation and wallet connection
- **AssetCard**: Asset display and actions
- **CreateAsset**: Asset creation form
- **Marketplace**: Trading interface
- **UserProfile**: User dashboard and assets
- **SearchFilters**: Advanced search functionality

### Pages
- **Home**: Landing page with featured assets
- **Explore**: Asset discovery and browsing
- **Create**: Asset creation workflow
- **Dashboard**: User asset management
- **Marketplace**: Trading interface
- **Asset Details**: Individual asset pages

## 🔌 API Endpoints

### Assets
- `GET /api/assets` - List all assets
- `GET /api/assets/:id` - Get asset details
- `POST /api/assets` - Create new asset
- `PUT /api/assets/:id` - Update asset
- `DELETE /api/assets/:id` - Delete asset

### Marketplace
- `GET /api/marketplace/orders` - List orders
- `POST /api/marketplace/orders` - Create order
- `POST /api/marketplace/buy` - Buy asset
- `POST /api/marketplace/bid` - Place bid

### Licenses
- `GET /api/licenses` - List licenses
- `POST /api/licenses` - Create license
- `POST /api/licenses/:id/usage` - Record usage

### Users
- `GET /api/users/:id` - Get user profile
- `PUT /api/users/:id` - Update profile
- `GET /api/users/:id/assets` - Get user assets

## 🗄️ Database Schema

### Core Tables
- **users**: User profiles and wallet addresses
- **assets**: AI assets with metadata
- **asset_versions**: Version history
- **orders**: Marketplace orders
- **bids**: Auction bids
- **licenses**: Asset licenses
- **transactions**: Blockchain transactions

## 🔐 Security Features

- **Smart Contract Security**: ReentrancyGuard, Pausable, AccessControl
- **Input Validation**: Comprehensive validation on all inputs
- **Rate Limiting**: API rate limiting to prevent abuse
- **Authentication**: JWT-based authentication
- **Data Encryption**: Sensitive data encryption
- **Audit Trail**: Complete transaction history

## 🧪 Testing

### Run Tests
```bash
# Smart contracts
cd contracts
npm test

# Backend API
cd backend
npm test

# Frontend
cd frontend
npm test
```

### Test Coverage
- Unit tests for smart contracts
- Integration tests for API endpoints
- Component tests for React components
- End-to-end tests for critical workflows

## 🚀 Deployment

### Production Deployment

1. **Deploy Smart Contracts**
```bash
cd contracts
npx hardhat run scripts/deploy.js --network mainnet
```

2. **Deploy Backend**
```bash
cd backend
npm run build
# Deploy to your preferred cloud provider
```

3. **Deploy Frontend**
```bash
cd frontend
npm run build
# Deploy to Vercel, Netlify, or your preferred platform
```

### Environment Setup
- Configure production environment variables
- Set up production database
- Configure IPFS gateway
- Set up monitoring and logging

## 📊 Monitoring & Analytics

- **Transaction Monitoring**: Real-time transaction tracking
- **Performance Metrics**: API response times and throughput
- **User Analytics**: User behavior and engagement
- **Error Tracking**: Comprehensive error logging
- **Blockchain Events**: Smart contract event monitoring

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Ethereum](https://ethereum.org/) - Blockchain platform
- [IPFS](https://ipfs.io/) - Decentralized storage
- [Next.js](https://nextjs.org/) - React framework
- [Prisma](https://prisma.io/) - Database ORM
- [RainbowKit](https://rainbowkit.com/) - Wallet connection
- [Tailwind CSS](https://tailwindcss.com/) - Styling framework

## 📞 Support

- **Documentation**: [docs.aiassetmarketplace.com](https://docs.aiassetmarketplace.com)
- **Discord**: [discord.gg/aiassetmarketplace](https://discord.gg/aiassetmarketplace)
- **Email**: support@aiassetmarketplace.com
- **GitHub Issues**: [github.com/aiassetmarketplace/issues](https://github.com/aiassetmarketplace/issues)

## 🔮 Roadmap

### Phase 1 (Current)
- ✅ Core smart contracts
- ✅ Basic marketplace functionality
- ✅ IPFS integration
- ✅ User authentication

### Phase 2 (Q2 2024)
- 🔄 Advanced search and filtering
- 🔄 Mobile app
- 🔄 API marketplace
- 🔄 Advanced analytics

### Phase 3 (Q3 2024)
- ⏳ Cross-chain support
- ⏳ AI model inference marketplace
- ⏳ Collaborative development tools
- ⏳ Enterprise features

---

**Built with ❤️ by the AI Asset Marketplace Team**