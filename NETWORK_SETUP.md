# 🔐 Celo Network & Wallet Setup Guide

## 🌐 Network: Celo Sepolia Testnet

Bu proje **Celo Sepolia Testnet** kullanıyor (Alfajores'in yerini aldı).

### Network Bilgileri:

```
Network Name: Celo Sepolia Testnet
Chain ID: 11142220
RPC URL: https://forno.celo-sepolia.celo-testnet.org
Block Explorer: https://celo-sepolia.blockscout.com
Currency Symbol: CELO
```

---

## 💰 Test Token Nasıl Alınır?

### 1. Celo Faucet (Önerilen)

https://faucet.celo.org/sepolia

1. MetaMask adresinizi yapıştırın
2. Alfajores/Sepolia seçin
3. Test CELO ve cUSD alın

### 2. Alternative Faucets

- https://celo.org/developers/faucet
- Discord Celo kanalında `/faucet` komutu

---

## 🦊 MetaMask Yapılandırması

### Otomatik Ekleme (Önerilen)

1. Uygulamayı açın: http://localhost:3000/nlte
2. "Connect Wallet" tıklayın
3. MetaMask otomatik olarak Celo Sepolia'yı ekleyecek

### Manuel Ekleme

MetaMask'ta:

1. Networks → Add Network → Add a network manually
2. Yukarıdaki network bilgilerini girin
3. Save

---

## 🔑 Private Key Kullanımı (İsteğe Bağlı)

### ⚠️ ÖNEMLİ UYARILAR:

- Private key **SADECE** backend/server-side kullanım içindir
- **ASLA** private key'i frontend koduna koymayın
- **ASLA** private key'i Git'e commit etmeyin
- Test ağı için bile gerçek fonlar kullanmayın

### Kullanım Senaryoları:

#### 1. MetaMask ile (Önerilen - Kullanıcı İmzalı)

✅ Kullanıcı her işlemi MetaMask'ta onaylar
✅ Private key gerekmez
✅ Güvenli ve şeffaf

```typescript
// Frontend'de Wagmi kullanımı
import { useSendTransaction } from "wagmi";

const { sendTransaction } = useSendTransaction();
sendTransaction({ to, value });
```

#### 2. Private Key ile (Backend - Otomatik İmza)

⚠️ Sadece backend API routes'ta kullanın
⚠️ Kullanıcı onayı OLMADAN işlem yapar
⚠️ Test ağı için güvenli

```typescript
// Backend API Route: /api/auto-send
import { sendTransactionWithPrivateKey } from "@/utils/wallet-helpers";

const hash = await sendTransactionWithPrivateKey({
  to: "0x...",
  value: "0.1", // CELO amount
});
```

---

## 📝 .env.local Yapılandırması

### Minimum (Sadece MetaMask)

```bash
NEXT_PUBLIC_CELO_NETWORK=sepolia
NEXT_PUBLIC_SEPOLIA_RPC=https://forno.celo-sepolia.celo-testnet.org
```

### Backend Transaction Signing İçin

```bash
NEXT_PUBLIC_CELO_NETWORK=sepolia
NEXT_PUBLIC_SEPOLIA_RPC=https://forno.celo-sepolia.celo-testnet.org

# UYARI: Sadece test ağında kullanın!
PRIVATE_KEY=0xYOUR_PRIVATE_KEY_HERE
```

---

## 🔧 Private Key Nasıl Alınır?

### MetaMask'tan:

1. MetaMask → ⋮ (menü) → Account Details
2. "Show private key"
3. Parolanızı girin
4. Private key'i kopyalayın (0x ile başlar)

### Yeni Cüzdan Oluşturma (Sadece Test İçin):

```bash
# Node.js REPL'de
node
> const { Wallet } = require('ethers');
> const wallet = Wallet.createRandom();
> console.log('Address:', wallet.address);
> console.log('Private Key:', wallet.privateKey);
```

---

## 🚀 Kullanım Örnekleri

### 1. Frontend: MetaMask ile İşlem (Önerilen)

```typescript
// components/send-button.tsx
import { useSendTransaction } from "wagmi";
import { parseEther } from "viem";

export function SendButton() {
  const { sendTransaction } = useSendTransaction();

  const handleSend = async () => {
    sendTransaction({
      to: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
      value: parseEther("0.1"), // 0.1 CELO
    });
  };

  return <button onClick={handleSend}>Send with MetaMask</button>;
}
```

### 2. Backend: Private Key ile Otomatik İşlem

```typescript
// app/api/auto-send/route.ts
import { sendTransactionWithPrivateKey } from "@/utils/wallet-helpers";

export async function POST(req: Request) {
  const { recipient, amount } = await req.json();

  // UYARI: Kullanıcı onayı olmadan işlem yapar!
  const hash = await sendTransactionWithPrivateKey({
    to: recipient,
    value: amount,
  });

  return Response.json({ success: true, hash });
}
```

---

## 🛡️ Güvenlik En İyi Uygulamaları

### ✅ YAPILMASI GEREKENLER:

- MetaMask kullanın (kullanıcı kontrolü için)
- Private key'i `.env.local`'de saklayın
- `.env.local`'i `.gitignore`'a ekleyin
- Test ağında test edin
- Private key'i backend'de kullanın

### ❌ YAPILMAMASI GEREKENLER:

- Private key'i frontend koduna koymayın
- Private key'i Git'e commit etmeyin
- Gerçek fonları test anahtarlarıyla kullanmayın
- Private key'i public repolarla paylaşmayın
- Private key'i client-side state'te saklamayın

---

## 🔍 Debug & Troubleshooting

### MetaMask "Wrong Network" Hatası:

```typescript
// Chain değiştirme
import { useSwitchChain } from "wagmi";
const { switchChain } = useSwitchChain();
switchChain({ chainId: 11142220 }); // Celo Sepolia
```

### Private Key Hatası:

```bash
# .env.local'de kontrol edin
echo $PRIVATE_KEY  # Başında 0x olmalı
```

### RPC Connection Hatası:

```bash
# RPC URL'i test edin
curl https://forno.celo-sepolia.celo-testnet.org \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
```

---

## 📚 Daha Fazla Bilgi

- [Celo Docs](https://docs.celo.org)
- [Celo Faucet](https://faucet.celo.org)
- [Viem Docs](https://viem.sh)
- [Wagmi Docs](https://wagmi.sh)

---

## 🎯 Hızlı Başlangıç Checklist

- [ ] MetaMask yüklü
- [ ] Celo Sepolia ağı eklendi
- [ ] Test tokenleri alındı (faucet)
- [ ] `.env.local` yapılandırıldı
- [ ] `pnpm dev` çalıştırıldı
- [ ] http://localhost:3000/nlte açıldı
- [ ] "Connect Wallet" tıklandı
- [ ] "Send 100 cUSD to alice" test edildi

**Tebrikler! 🎉 Artık NLTE kullanmaya hazırsınız!**
