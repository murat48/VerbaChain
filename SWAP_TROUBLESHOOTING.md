# 🔄 SWAP Troubleshooting Guide

## ❓ Swap yapıldı ama cUSD görünmüyor?

### 1️⃣ **MetaMask'ta Token Ekle**

cUSD, cEUR, cREAL gibi tokenler MetaMask'ta otomatik görünmeyebilir. Manuel eklemeniz gerekiyor:

#### Adımlar:

1. MetaMask'ı açın
2. **"Tokens"** sekmesinde en alta inin
3. **"Import tokens"** tıklayın
4. Aşağıdaki adresleri ekleyin:

**Celo Alfajores/Sepolia Testnet:**

```
cUSD:  0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1
cEUR:  0x10c892A6EC43a53E45D0B916B4b7D383B1b78C0F
cREAL: 0xE4D517785D091D3c54818832dB6094bcc2744545
```

5. **"Add Custom Token"** tıklayın
6. Token otomatik görecektir

---

### 2️⃣ **Transaction Hash Kontrol**

İşlem başarılı olduysa block explorer'da görünmelidir:

1. NLTE success ekranında **"View on Block Explorer"** linkine tıklayın
2. Transaction sayfasında kontrol edin:
   - ✅ **Status**: Success (yeşil)
   - 📊 **Logs**: Token transfer eventi olmalı
   - 💰 **Token Transfers**: cUSD transferi görünmeli

**Block Explorer:** https://celo-sepolia.blockscout.com

---

### 3️⃣ **Manuel Bakiye Kontrol**

Blockchain'de bakiyeniz varsa ama görünmüyorsa:

```bash
# RPC ile kontrol
curl https://alfajores-forno.celo-testnet.org \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc":"2.0",
    "method":"eth_call",
    "params":[{
      "to":"0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1",
      "data":"0x70a08231000000000000000000000000YOUR_ADDRESS_HERE"
    },"latest"],
    "id":1
  }'
```

---

### 4️⃣ **Yaygın Sorunlar ve Çözümler**

#### ❌ Problem: "Transaction successful" ama token yok

**Sebep:** Swap gerçekleşmedi, sadece CELO gönderildi
**Çözüm:**

- Ubeswap pool'unda yeterli likidite olmalı
- Router kontratı doğru olmalı: `0xE3D8bd6Aed4F159bc8000a9cD47CffDb95F96121`

#### ❌ Problem: "Transaction failed"

**Sebep:** Slippage çok düşük veya pool yok
**Çözüm:**

- Slippage tolerance artırın (0.5% → 1%)
- Daha küçük miktarlar deneyin
- Pool liquidity kontrol edin

#### ❌ Problem: Gas fee çok yüksek

**Sebep:** Swap işlemleri normal transfer'den daha pahalı
**Çözüm:**

- Normal: ~150,000-250,000 gas
- Beklenen maliyet: ~0.01-0.05 CELO

---

### 5️⃣ **Swap İşlemini Doğrulama**

Block explorer'da transaction'ınızı açın ve kontrol edin:

#### ✅ Başarılı Swap Göstergeleri:

```
Status: ✓ Success

Internal Transactions:
├─ CELO Transfer (0.002 CELO → Ubeswap Router)
└─ cUSD Transfer (Router → Your Address)

Logs:
├─ Swap Event (Ubeswap Pair)
├─ Transfer Event (CELO)
└─ Transfer Event (cUSD)
```

#### ❌ Başarısız Swap:

```
Status: ✗ Failed

Revert Reason:
- "Insufficient liquidity"
- "K"
- "Transfer failed"
```

---

### 6️⃣ **Debug Komutları**

#### MetaMask Console'da Token Bakiyesi:

```javascript
// MetaMask Developer Console
const cUSD_ADDRESS = "0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1";
const ABI = [
  {
    constant: true,
    inputs: [{ name: "_owner", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "balance", type: "uint256" }],
    type: "function",
  },
];

const contract = new web3.eth.Contract(ABI, cUSD_ADDRESS);
const balance = await contract.methods.balanceOf(YOUR_ADDRESS).call();
console.log("cUSD Balance:", web3.utils.fromWei(balance, "ether"));
```

---

### 7️⃣ **Alternatif DEX'ler (Gelecek)**

Ubeswap çalışmazsa deneyebileceğiniz alternatifler:

- **Mento**: Celo'nun resmi stabilitesi protokolü
- **Curve**: Stablecoin swap'ları için optimize
- **SushiSwap**: Cross-chain DEX

---

## 🔍 Hızlı Kontrol Listesi

- [ ] MetaMask'ta doğru network seçili (Celo Alfajores/Sepolia)
- [ ] cUSD token'ı MetaMask'a eklendi
- [ ] Transaction hash var ve "Success" durumunda
- [ ] Block explorer'da "Token Transfers" bölümü kontrol edildi
- [ ] MetaMask'ta "Refresh" yapıldı
- [ ] Birkaç dakika beklendi (blockchain confirmation)

---

## 📞 Yardım

Hala sorun varsa:

1. Transaction hash'i paylaşın
2. Wallet adresinizi paylaşın (public - güvenli)
3. Block explorer linkini kontrol edin

**Örnek Transaction:** https://celo-sepolia.blockscout.com/tx/0x...
