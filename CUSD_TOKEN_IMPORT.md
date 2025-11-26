# cUSD Token'ı MetaMask'ta Görememe - Çözüm

## Problem

Circle Faucet'ten cUSD aldınız ama MetaMask'ta göremiyorsunuz.

## Neden?

MetaMask custom token'ları otomatik göstermez, **manuel import** gerekir.

## ✅ ÇÖZÜM - Token'ı MetaMask'a Ekleyin

### Yöntem 1: Otomatik Import (NLTE Uygulamasından)

1. NLTE uygulamasında bir SWAP yapın (veya yaptıysanız)
2. Success screen'de **"🦊 cUSD Token'ı MetaMask'a Ekle"** butonuna tıklayın
3. MetaMask pop-up açılacak → **"Add Token"** tıklayın
4. cUSD otomatik eklenecek!

### Yöntem 2: Manuel Import (MetaMask'tan)

1. MetaMask'ı açın
2. **Celo Sepolia Testnet** seçili olduğundan emin olun
3. Aşağı scroll edin → **"Import tokens"** tıklayın
4. **"Custom token"** sekmesini seçin
5. Şu bilgileri girin:

```
Token Contract Address: 0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1
Token Symbol: cUSD
Token Decimal: 18
```

6. **"Add Custom Token"** → **"Import Tokens"** tıklayın
7. cUSD artık göreceksiniz! 🎉

### Yöntem 3: Tek Tıkla Import (Tarayıcıdan)

Bu linke tıklayın (MetaMask otomatik açılacak):

```
https://celo-sepolia.blockscout.com/token/0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1?tab=token_transfers
```

Sayfada **"Add to MetaMask"** butonu olacak → Tıklayın!

## 🔍 Faucet İşlemi Gerçekten Başarılı mı?

### Block Explorer'da Kontrol Edin:

```
https://celo-sepolia.blockscout.com/address/[WALLET_ADRESİNİZ]
```

- **Transactions** kısmına bakın
- Son transaction'da **cUSD transfer** gördüyseniz → Faucet başarılı ✅
- Sadece CELO varsa → Faucet başarısız veya henüz gelmedi ⏳

### Alternatif: Celo Faucet

Circle faucet çalışmadıysa resmi Celo faucet deneyin:

```
https://faucet.celo.org
```

- Sepolia Testnet seçin
- Wallet adresinizi girin
- **cUSD** seçin → "Get Tokens"
- 1-2 dakika bekleyin

## 📝 Diğer Token'ları da Ekleyin

Aynı şekilde diğer Celo stablecoin'leri de ekleyebilirsiniz:

### cEUR (Euro Stablecoin)

```
Address: 0x10c892A6EC43a53E45D0B916B4b7D383B1b78C0F
Symbol: cEUR
Decimals: 18
```

### cREAL (Brazilian Real Stablecoin)

```
Address: 0xE4D517785D091D3c54818832dB6094bcc2744545
Symbol: cREAL
Decimals: 18
```

## ⚡ Hızlı Test

Token'ı ekledikten sonra NLTE'de test edin:

```
send 1 cUSD to alice
```

Alice = `0x7e977899cCFdFF2lands4B31a2e15cCa5dc0b5F39` (test contact)

## 🎯 Özet

1. **Circle faucet'ten gelen cUSD var** → Ama göremiyorsunuz
2. **MetaMask manuel import gerek** → Yukarıdaki adımları takip edin
3. **Token eklenince bakiye görünecek** → Test edin!

Token address'i kesinlikle doğru: `0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1`
