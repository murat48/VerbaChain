# NLTE Quick Start Guide

## 5-Minute Setup

### Step 1: Install & Run

```bash
cd /home/muratkeskin/celoprojects/VerbaChain/apps/web
pnpm install
pnpm dev
```

### Step 2: Get Testnet Funds

1. Go to [Celo Faucet](https://faucet.celo.org)
2. Enter your wallet address
3. Request CELO and cUSD (test tokens)

### Step 3: Connect Wallet

1. Open http://localhost:3000
2. Click "Connect Wallet"
3. Approve MetaMask
4. Select "Celo Alfajores Testnet"

### Step 4: Try a Command

Type in the NLTE input:

```
Send 10 cUSD to 0x742d35Cc6634C0532925a3b844Bc1e9c34b78f0f
```

Or try any of these:

- `Send 50 CELO to Alice`
- `Swap 100 CELO for cUSD`
- `Stake 500 CELO`
- `Claim my rewards`

## Example Commands by Intent

### 1. SEND - Transfer tokens

```
Send 100 cUSD to Alice
Transfer 50 CELO to Bob
Pay 25.5 cEUR to 0x1234567890123456789012345678901234567890
Give 0xABC... 100 cREAL
```

### 2. SWAP - Exchange tokens

```
Swap 50 CELO for cUSD
Exchange 100 cUSD to cEUR
Convert 1000 cREAL to CELO
```

### 3. STAKE - Lock tokens

```
Stake 1000 CELO
Lock 500 CELO for 30 days
```

### 4. CLAIM_REWARDS - Collect rewards

```
Claim my rewards
Harvest rewards
Collect earnings
```

## Troubleshooting

### "Connect Your Wallet" Error

- Install MetaMask browser extension
- Create/import wallet
- Ensure on Alfajores testnet

### Insufficient Balance

- Get testnet funds from [Celo Faucet](https://faucet.celo.org)
- Wait for transaction confirmation (1-2 min)
- Refresh page

### "Invalid Address" Error

- Use wallet address format: `0x1234...`
- Or use ENS names (if supported)
- Don't include spaces

### Transaction Fails

- Check gas estimate displayed
- Verify sufficient balance
- Ensure correct token selected
- Check MetaMask is on Alfajores

## API Testing

### Parse Command

```bash
curl -X POST http://localhost:3000/api/nlte/parse \
  -H "Content-Type: application/json" \
  -d '{"command":"Send 100 cUSD to Alice"}'
```

Response:

```json
{
  "success": true,
  "data": {
    "intent": "SEND",
    "parameters": {
      "amount": "100",
      "token": "cUSD",
      "recipient": "Alice"
    },
    "confidence": 0.85
  }
}
```

### Get Examples

```bash
curl http://localhost:3000/api/nlte/examples
```

## Environment Setup

Create `.env.local` in `apps/web/`:

```env
# Network
NEXT_PUBLIC_CELO_NETWORK=alfajores
NEXT_PUBLIC_ALFAJORES_RPC=https://alfajores-forno.celo-testnet.org

# Optional integrations
NEXT_PUBLIC_SELF_PROTOCOL_ENABLED=false
NEXT_PUBLIC_MINIAPP_ENABLED=false
```

## Key Files

| File                           | Purpose                  |
| ------------------------------ | ------------------------ |
| `lib/nlp-parser.ts`            | Natural language parsing |
| `utils/celo-sdk.ts`            | Blockchain interactions  |
| `utils/transaction-helpers.ts` | Transaction logic        |
| `components/nlte-*.tsx`        | UI components            |
| `app/api/nlte/*`               | API routes               |

## Next Steps

1. **Explore Components**

   - `nlte-input.tsx` - Input UI
   - `nlte-draft-display.tsx` - Approval UI
   - `nlte-page.tsx` - Main container

2. **Understand Flow**

   - User types command
   - API parses command
   - Draft transaction
   - Display for approval
   - Send via MetaMask

3. **Add Features**
   - More token types
   - Custom address resolution
   - Transaction history
   - Swap integration

## Common Patterns

### Custom Command

Edit `lib/nlp-parser.ts`:

```typescript
const INTENT_PATTERNS = {
  YOUR_INTENT: [/your regex pattern/gi],
};
```

### New Token

Update `utils/celo-config.ts`:

```typescript
export const CELO_TOKENS = {
  alfajores: {
    NEW_TOKEN: "0x...",
  },
};
```

### API Integration

Create new route `app/api/nlte/your-endpoint/route.ts`:

```typescript
export async function POST(req) {
  const body = await req.json();
  // Your logic
  return NextResponse.json(result);
}
```

## Support Resources

- Celo Docs: https://docs.celo.org
- Viem Documentation: https://viem.sh
- Ethers.js: https://docs.ethers.org
- Celo Block Explorer: https://alfajores.celoscan.io

## Performance Tips

1. **Cache balance checks** - Reduces RPC calls
2. **Batch gas estimates** - Group multiple estimates
3. **Use example patterns** - Faster parsing
4. **Optimize re-renders** - Use React.memo on components

---

Ready to build! Happy coding! 🚀
