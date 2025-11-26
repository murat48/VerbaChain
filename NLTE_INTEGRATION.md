# NLTE Integration Guide

## Adding NLTE to Your Application

This guide shows how to integrate NLTE components and APIs into your Celo application.

## Option 1: Use Standalone Components

### 1. Import NLTE Page Component

```tsx
// app/nlte/page.tsx
import { NLTEPage } from "@/components/nlte-page";

export default function NLTEPageRoute() {
  return <NLTEPage />;
}
```

**Access at:** `http://localhost:3000/nlte`

### 2. Add to Your Layout

```tsx
// app/layout.tsx
import { NLTEPage } from "@/components/nlte-page";

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <nav>{/* Your nav */}</nav>
        <section>{children}</section>
        <section>
          <NLTEPage />
        </section>
      </body>
    </html>
  );
}
```

## Option 2: Use Individual Components

### NLTEInput Component

```tsx
"use client";

import { NLTEInput } from "@/components/nlte-input";
import { ParseCommandResponse } from "@/types/nlte.types";

export function MyComponent() {
  const handleParsed = (response: ParseCommandResponse) => {
    console.log("Parsed:", response.data);
    // Handle parsed command
  };

  const handleError = (error: string) => {
    console.error("Error:", error);
  };

  return (
    <div>
      <h1>Send Transactions</h1>
      <NLTEInput onCommandParsed={handleParsed} onError={handleError} />
    </div>
  );
}
```

### TransactionDraftDisplay Component

```tsx
"use client";

import { useState } from "react";
import { TransactionDraftDisplay } from "@/components/nlte-draft-display";
import { TransactionDraft } from "@/types/nlte.types";

export function ReviewTransaction({ draft }: { draft: TransactionDraft }) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleApprove = async () => {
    setIsSubmitting(true);
    try {
      // Send transaction via MetaMask
      // Your implementation
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <TransactionDraftDisplay
      draft={draft}
      onApprove={handleApprove}
      onReject={() => console.log("Rejected")}
      isProcessing={isSubmitting}
    />
  );
}
```

## Option 3: Use API Routes Directly

### In Your Backend/Frontend

```typescript
// service/nlte-service.ts
export async function parseCommand(command: string) {
  const res = await fetch("/api/nlte/parse", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ command }),
  });
  return res.json();
}

export async function draftTransaction(
  parsedCommand: ParsedCommand,
  userAddress: string
) {
  const res = await fetch("/api/nlte/draft", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ parsedCommand, userAddress }),
  });
  return res.json();
}

export async function getExamples() {
  const res = await fetch("/api/nlte/examples");
  return res.json();
}
```

### Usage

```typescript
import { parseCommand, draftTransaction } from "@/service/nlte-service";
import { useAccount } from "wagmi";

function MyApp() {
  const { address } = useAccount();

  const handleCommand = async (command: string) => {
    const parseRes = await parseCommand(command);
    if (parseRes.success) {
      const draftRes = await draftTransaction(parseRes.data, address);
      console.log("Transaction ready:", draftRes.data);
    }
  };

  return <div onClick={() => handleCommand("Send 100 cUSD to Alice")} />;
}
```

## Option 4: Custom Implementation

### Extend NLP Parser

```typescript
// lib/custom-nlp-parser.ts
import { parseNLCommand } from "@/lib/nlp-parser";
import { ParsedCommand, NaturalLanguageCommand } from "@/types/nlte.types";

export function parseCustomCommand(cmd: NaturalLanguageCommand): ParsedCommand {
  // Add your custom patterns
  const customParsed = parseNLCommand(cmd);

  // Enhance with custom logic
  return {
    ...customParsed,
    // Your enhancements
  };
}
```

### Extend Transaction Validation

```typescript
// utils/custom-validators.ts
import { validateTransaction } from "@/utils/transaction-helpers";
import { TransactionDraft, ValidationResult } from "@/types/nlte.types";

export async function validateCustomTransaction(
  draft: TransactionDraft
): Promise<ValidationResult> {
  const baseValidation = await validateTransaction(draft);

  // Add custom validation
  if (needsCustomCheck(draft)) {
    baseValidation.errors.push({
      code: "CUSTOM_CHECK_FAILED",
      message: "Your custom check",
    });
  }

  return baseValidation;
}
```

### Extend SDK Functions

```typescript
// utils/custom-celo-sdk.ts
import { getTokenBalance, sendTokenTransfer } from "@/utils/celo-sdk";
import { CeloToken } from "@/types/nlte.types";

// Wrapper with custom pre/post processing
export async function sendWithAnalytics(
  to: `0x${string}`,
  amount: bigint,
  token: CeloToken
) {
  console.log("Sending transaction...");

  const hash = await sendTokenTransfer(to, amount, token);

  // Analytics, notifications, etc.
  trackTransaction(hash);

  return hash;
}
```

## Feature Integration Points

### 1. Self Protocol (Privacy)

```typescript
// pages/nlte.tsx
import { initializeSelfProtocol } from "@/utils/self-protocol-integration";

export default function NLTEWithPrivacy() {
  useEffect(() => {
    initializeSelfProtocol({
      enabled: true,
      apiKey: process.env.NEXT_PUBLIC_SELF_PROTOCOL_KEY,
      endpoint: process.env.NEXT_PUBLIC_SELF_PROTOCOL_ENDPOINT,
    });
  }, []);

  return <NLTEPage />;
}
```

### 2. MiniApp Support

```typescript
// pages/miniapp-nlte.tsx
import { initializeMiniApp } from "@/utils/miniapp-integration";

export default function MiniAppNLTE() {
  useEffect(() => {
    initializeMiniApp({
      enabled: true,
      appId: "my-nlte-miniapp",
    });
  }, []);

  return <NLTEPage />;
}
```

### 3. Historical Tracking

```typescript
// utils/transaction-history.ts
import { draftTransaction } from "@/utils/transaction-helpers";

const transactionHistory: TransactionResult[] = [];

export async function trackTransaction(parsed: ParsedCommand, address: string) {
  const draft = await draftTransaction(parsed, address);

  transactionHistory.push({
    id: draft.id,
    command: parsed.rawCommand,
    intent: draft.intent,
    amount: draft.amount,
    token: draft.token,
    timestamp: draft.timestamp,
  });

  return draft;
}
```

## Styling & Theming

### Customize Tailwind

```tsx
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        "nlte-primary": "#1F2937",
        "nlte-secondary": "#3B82F6",
      },
    },
  },
};
```

### Custom CSS

```css
/* components/nlte-custom.css */
.nlte-container {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  padding: 24px;
}

.nlte-button {
  transition: all 0.3s ease;
}

.nlte-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
}
```

### Override Component Styles

```tsx
<div className="nlte-container custom-theme">
  <NLTEPage />
</div>
```

## Error Handling Strategy

```typescript
// utils/error-handler.ts
import {
  ParseCommandResponse,
  DraftTransactionResponse,
} from "@/types/nlte.types";

export function handleNLTEError(
  error: any,
  context: "parse" | "draft" | "submit"
): string {
  if (error.message.includes("network")) {
    return "Network connection error. Check your internet.";
  }

  if (error.message.includes("balance")) {
    return "Insufficient balance for this transaction.";
  }

  if (error.message.includes("address")) {
    return "Invalid recipient address.";
  }

  return `Error during ${context}: ${error.message}`;
}
```

## Performance Optimization

### Memoize Components

```tsx
import React from "react";
import { NLTEInput } from "@/components/nlte-input";

const MemoNLTEInput = React.memo(NLTEInput, (prev, next) => {
  return prev.isLoading === next.isLoading;
});
```

### Lazy Load Components

```tsx
import dynamic from "next/dynamic";

const NLTEPage = dynamic(() => import("@/components/nlte-page"), {
  loading: () => <div>Loading...</div>,
});
```

### Cache API Responses

```typescript
const cache = new Map();

export async function getCachedExamples() {
  const cached = cache.get("examples");
  if (cached) return cached;

  const res = await fetch("/api/nlte/examples");
  const data = await res.json();

  cache.set("examples", data);
  setTimeout(() => cache.delete("examples"), 5 * 60 * 1000); // 5 min

  return data;
}
```

## Deployment

### Vercel/Next.js Deployment

```bash
# .env.production
NEXT_PUBLIC_CELO_NETWORK=mainnet
NEXT_PUBLIC_ALFAJORES_RPC=https://forno.celo.org
```

### Docker Deployment

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY . .
RUN pnpm install
RUN pnpm build
EXPOSE 3000
CMD ["pnpm", "start"]
```

## Testing Integration

```typescript
// __tests__/nlte-integration.test.ts
import { parseCommand, draftTransaction } from "@/service/nlte-service";

describe("NLTE Integration", () => {
  it("should parse and draft transaction", async () => {
    const parseRes = await parseCommand("Send 100 cUSD to Alice");
    expect(parseRes.success).toBe(true);

    const draftRes = await draftTransaction(
      parseRes.data,
      "0x1234567890123456789012345678901234567890"
    );
    expect(draftRes.success).toBe(true);
  });
});
```

## Troubleshooting Integration

| Issue                    | Solution                            |
| ------------------------ | ----------------------------------- |
| Components not rendering | Check imports and Wagmi setup       |
| API routes 404           | Verify file path in `app/api/nlte/` |
| Styles not applied       | Ensure Tailwind configured          |
| Type errors              | Check TypeScript types imported     |
| MetaMask not connecting  | Verify wallet provider wrapper      |

## Next Steps

1. Choose integration option that fits your needs
2. Customize components and styles
3. Add your own validation rules
4. Integrate with your analytics
5. Deploy and test on Alfajores
6. Go mainnet when ready

---

Ready to integrate? Start with Option 1 for quickest setup! 🚀
