# VerbaChain 🔗

**VerbaChain** is a next-generation blockchain application built on the Celo network that revolutionizes how users interact with cryptocurrency through natural language. Send crypto, schedule transfers, stake tokens, and manage your portfolio using simple, conversational commands.

## 🌟 Key Features

### 💬 Natural Language Transaction Engine (NLTE)

Transform everyday language into blockchain transactions:

- **"Send 10 CELO to Alice tomorrow at 3pm"** - Automatically parses and schedules the transfer
- **"Swap 50 cUSD for CELO"** - Instant token swaps with minimal friction
- **"Stake 100 CELO for rewards"** - Easy staking with natural commands

### 🎯 Core Capabilities

#### 📤 Smart Transfers

- **Instant Transfers**: Send CELO, cUSD, cEUR, and custom tokens
- **Scheduled Transfers**: Set up future payments with date and time
- **Recurring Payments**: Automate regular transactions
- **Contact Management**: Save and send to contacts by name
- **Multi-Token Support**: Handle various Celo ecosystem tokens

#### 💱 Token Swaps

- **Decentralized Exchange Integration**: Swap tokens using Uniswap V3 on Celo
- **Real-time Price Quotes**: Get accurate exchange rates
- **Slippage Protection**: Secure trades with configurable slippage
- **Natural Language Swaps**: "Swap X for Y" - it just works

#### 💰 Staking System

- **Native CELO Staking**: Earn rewards by staking CELO tokens
- **Smart Contract Integration**: Secure, audited staking contracts
- **Flexible Unstaking**: Withdraw your stakes anytime
- **Rewards Tracking**: Monitor your earnings in real-time
- **APY Display**: View current staking rates

#### 📊 Dashboard & Analytics

- **Portfolio Overview**: Track all your assets in one place
- **Transaction History**: Detailed logs of all activities
- **Pending Transactions**: Monitor scheduled transfers
- **Staking Statistics**: View staking performance and rewards
- **Real-time Balance Updates**: Stay informed with live data

#### 🔔 Notifications System

- **Transaction Alerts**: Get notified on successful transfers
- **Staking Updates**: Notifications for staking rewards
- **Scheduled Transfer Reminders**: Never miss a payment
- **Error Alerts**: Immediate notification of any issues

#### 🤖 Telegram Integration

- **Bot Notifications**: Receive updates directly on Telegram
- **Secure Setup**: Easy bot token configuration
- **Custom Chat IDs**: Personal notification channels
- **Real-time Updates**: Instant transaction confirmations

## 🏗️ Architecture

### Monorepo Structure

```
VerbaChain/
├── apps/
│   ├── web/                    # Next.js frontend application
│   │   ├── src/
│   │   │   ├── app/           # App router pages
│   │   │   │   ├── dashboard/ # Main dashboard
│   │   │   │   ├── nlte/      # Natural language interface
│   │   │   │   ├── staking/   # Staking interface
│   │   │   │   ├── history/   # Transaction history
│   │   │   │   ├── scheduled/ # Scheduled transfers
│   │   │   │   ├── contacts/  # Contact management
│   │   │   │   ├── telegram/  # Telegram settings
│   │   │   │   └── api/       # API routes
│   │   │   ├── components/    # React components
│   │   │   ├── lib/           # Utilities and helpers
│   │   │   ├── types/         # TypeScript definitions
│   │   │   └── utils/         # Blockchain utilities
│   │   └── public/            # Static assets
│   │
│   └── contracts/             # Hardhat smart contracts
│       ├── contracts/         # Solidity contracts
│       │   ├── CeloStaking.sol
│       │   └── CeloRewards.sol
│       ├── scripts/           # Deployment scripts
│       ├── test/              # Contract tests
│       └── ignition/          # Hardhat Ignition modules
│
└── Documentation/             # Project documentation
    ├── README.md              # This file
    ├── NLTE_README.md         # NLTE detailed docs
    ├── STAKING_DEPLOYMENT.md  # Staking guide
    └── NETWORK_SETUP.md       # Network configuration
```

## 🚀 Quick Start

### Prerequisites

- **Node.js**: v18.0.0 or higher
- **pnpm**: v8.0.0 or higher (recommended) or npm
- **MetaMask**: Browser extension installed
- **Celo Wallet**: Some testnet CELO tokens for testing

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/yourusername/VerbaChain.git
   cd VerbaChain
   ```

2. **Install dependencies**

   ```bash
   pnpm install
   ```

3. **Set up environment variables**

   Create a `.env.local` file in `apps/web/`:

   ```env
   # Network Configuration
   NEXT_PUBLIC_NETWORK=sepolia

   # Contract Addresses (Sepolia Testnet)
   NEXT_PUBLIC_STAKING_CONTRACT=0x...
   NEXT_PUBLIC_REWARDS_CONTRACT=0x...

   # Telegram (Optional)
   NEXT_PUBLIC_TELEGRAM_BOT_TOKEN=your_bot_token
   NEXT_PUBLIC_TELEGRAM_CHAT_ID=your_chat_id
   ```

4. **Start the development server**

   ```bash
   pnpm dev
   ```

5. **Open your browser**

   Navigate to [http://localhost:3000](http://localhost:3000)

### Get Testnet Tokens

1. Visit [Celo Faucet](https://faucet.celo.org)
2. Connect your MetaMask wallet
3. Request testnet CELO and cUSD tokens
4. Wait for the transaction to confirm

## 📱 Usage Guide

### Connecting Your Wallet

1. Click **"Connect Wallet"** in the navigation bar
2. Select MetaMask from the wallet options
3. Approve the connection request
4. Ensure you're on the Celo Sepolia testnet

### Using Natural Language Transfers

1. Navigate to the **NLTE** page
2. Type your command in plain English:
   - `"Send 5 CELO to 0x123..."`
   - `"Transfer 10 cUSD to John"`
   - `"Send 2 CELO tomorrow at 2pm"`
3. Review the parsed transaction details
4. Click **"Execute"** to confirm
5. Approve the transaction in MetaMask

### Swapping Tokens

1. Go to the **Dashboard**
2. Use the swap interface or type:
   - `"Swap 10 cUSD for CELO"`
3. Review the exchange rate
4. Confirm the swap
5. Approve in MetaMask

### Staking CELO

1. Navigate to the **Staking** page
2. Enter the amount to stake or use natural language:
   - `"Stake 50 CELO"`
3. Review the estimated rewards
4. Click **"Stake"**
5. Approve the transaction
6. View your active stakes and rewards

### Managing Contacts

1. Go to **Contacts** page
2. Click **"Add Contact"**
3. Enter name and wallet address
4. Save the contact
5. Use contact names in transfers: `"Send 5 CELO to Alice"`

### Scheduled Transfers

1. Visit **Scheduled Transfers**
2. Create a new scheduled transfer
3. Set date and time
4. The system will automatically execute at the specified time
5. View pending and completed schedules

## 🛠️ Technology Stack

### Frontend

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **State Management**: React Hooks & Context
- **Web3 Integration**: Viem, Wagmi

### Backend/Blockchain

- **Blockchain**: Celo (Ethereum-compatible)
- **Smart Contracts**: Solidity
- **Development**: Hardhat
- **Testing**: Hardhat Test Suite
- **Deployment**: Hardhat Ignition

### Build Tools

- **Monorepo**: Turborepo
- **Package Manager**: pnpm
- **Type Checking**: TypeScript
- **Linting**: ESLint
- **Formatting**: Prettier

### APIs & Integrations

- **NLP Parser**: Custom natural language processor
- **Telegram Bot**: Node.js Telegram Bot API
- **Uniswap V3**: DEX integration for swaps
- **Celo SDK**: Native Celo integrations

## 📜 Smart Contracts

### CeloStaking.sol

The main staking contract that handles:

- Staking CELO tokens
- Tracking user stakes
- Calculating rewards
- Unstaking functionality
- Emergency withdrawals

**Key Functions:**

```solidity
function stake() external payable
function unstake(uint256 amount) external
function claimRewards() external
function getStakedBalance(address user) external view returns (uint256)
function getRewards(address user) external view returns (uint256)
```

### CeloRewards.sol

Manages reward distribution and calculations:

- Time-based reward accrual
- APY calculations
- Reward pool management
- Distribution logic

**Deployed Contracts (Sepolia Testnet):**

- Staking: `0x...` (See STAKING_DEPLOYMENT.md)
- Rewards: `0x...` (See STAKING_DEPLOYMENT.md)

## 🔧 Development

### Available Scripts

```bash
# Development
pnpm dev              # Start all development servers
pnpm build            # Build all packages
pnpm lint             # Lint all packages
pnpm type-check       # Type check all packages
pnpm clean            # Clean all build artifacts

# Smart Contracts
pnpm contracts:compile            # Compile contracts
pnpm contracts:test               # Run contract tests
pnpm contracts:deploy             # Deploy to local network
pnpm contracts:deploy:sepolia     # Deploy to Sepolia testnet
pnpm contracts:deploy:celo        # Deploy to Celo mainnet

# Web App (from apps/web/)
cd apps/web
pnpm dev              # Start Next.js dev server
pnpm build            # Build for production
pnpm start            # Start production server
pnpm lint             # Lint web app
```

### Testing

#### Smart Contract Tests

```bash
cd apps/contracts
pnpm test
```

#### Frontend Tests

```bash
cd apps/web
pnpm test
```

### Deploying Contracts

1. **Configure network in hardhat.config.ts**
2. **Set up your deployer wallet private key**
3. **Run deployment:**
   ```bash
   pnpm contracts:deploy:sepolia
   ```
4. **Update contract addresses in .env.local**
5. **Verify contracts on Sepolia Etherscan (optional)**

## 🌐 Network Configuration

### Supported Networks

| Network             | Chain ID | RPC URL                                  | Block Explorer                |
| ------------------- | -------- | ---------------------------------------- | ----------------------------- |
| Sepolia (Testnet)   | 11155111 | https://sepolia.infura.io/v3/YOUR_KEY    | https://sepolia.etherscan.io  |
| Celo Mainnet        | 42220    | https://forno.celo.org                   | https://celoscan.io           |

### Adding Sepolia to MetaMask

**Sepolia Testnet:**

- Network Name: Sepolia
- RPC URL: https://sepolia.infura.io/v3/YOUR_KEY
- Chain ID: 11155111
- Currency Symbol: ETH
- Block Explorer: https://sepolia.etherscan.io

## 🔐 Security

### Best Practices

- Never commit private keys or sensitive data
- Use environment variables for configuration
- Always test on testnet before mainnet
- Audit smart contracts before deployment
- Use hardware wallets for production funds
- Implement proper access controls
- Validate all user inputs

### Smart Contract Security

- Contracts use OpenZeppelin libraries
- ReentrancyGuard on all state-changing functions
- Proper access control with Ownable
- Events for all critical operations
- Comprehensive test coverage

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Coding Standards

- Follow TypeScript/Solidity best practices
- Write meaningful commit messages
- Add tests for new features
- Update documentation as needed
- Use ESLint and Prettier configurations

## 📚 Documentation

- **[NLTE Documentation](./NLTE_README.md)** - Detailed NLTE implementation guide
- **[Staking Guide](./STAKING_DEPLOYMENT.md)** - Complete staking system documentation
- **[Network Setup](./NETWORK_SETUP.md)** - Network configuration and setup
- **[API Documentation](./docs/API.md)** - API endpoints and usage
- **[Smart Contract Docs](./apps/contracts/README.md)** - Contract specifications

## 🐛 Troubleshooting

### Common Issues

**MetaMask not connecting?**

- Ensure you're on the correct network (Alfajores)
- Try refreshing the page
- Clear browser cache and reconnect

**Transaction failing?**

- Check you have enough CELO for gas
- Verify token balances
- Check if you approved token spending

**Staking not working?**

- Verify contract addresses in .env.local
- Ensure contracts are deployed on the network
- Check you have sufficient CELO balance

**NLTE parsing errors?**

- Use clear, simple language
- Include necessary details (amount, recipient, token)
- Check example commands for format

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Celo Foundation** - For the amazing blockchain platform
- **Next.js Team** - For the incredible framework
- **shadcn/ui** - For the beautiful UI components
- **OpenZeppelin** - For secure smart contract libraries
- **Uniswap** - For DEX integration capabilities

## 📞 Support & Contact

- **Website**: [https://verbachain.com](https://verbachain.com)
- **Email**: support@verbachain.com
- **Twitter**: [@VerbaChain](https://twitter.com/verbachain)
- **Discord**: [Join our community](https://discord.gg/verbachain)
- **GitHub**: [github.com/verbachain](https://github.com/verbachain)

## 🗺️ Roadmap

### Q1 2025

- ✅ Natural Language Transaction Engine
- ✅ Basic staking functionality
- ✅ Token swap integration
- ✅ Telegram notifications

### Q2 2025

- 🔄 Advanced scheduling features
- 🔄 Multi-signature wallet support
- 🔄 Mobile app development
- 🔄 Additional language support

### Q3 2026

- 📋 DeFi protocol integrations
- 📋 NFT support
- 📋 Cross-chain bridges
- 📋 Advanced analytics dashboard

### Q4 2026

- 📋 Mainnet launch
- 📋 Governance token
- 📋 DAO implementation
- 📋 Enterprise solutions

---

**Built with ❤️ on Celo** | **Making blockchain accessible through natural language**

_VerbaChain - Where Words Meet Blockchain_
