# Celo Staking & Rewards Contracts

Bu klasörde STAKE ve CLAIM_REWARDS işlemleri için yazılmış Solidity smart contract'ları bulunmaktadır.

## 📋 Contracts

### 1. CeloStaking.sol

CELO token'larını stake etmek için kullanılan contract.

**Özellikler:**

- Esnek veya sabit süreli staking (0, 30, 90, 180, 365 gün)
- Süreye göre farklı APY oranları
- Stake edilen tokenlara otomatik ödül hesaplama
- Ödül talep etme (unstake yapmadan)
- Tüm ödülleri birden talep etme

**APY Oranları:**

- Esnek (0 gün): %3 APY
- 30 gün: %5 APY
- 90 gün: %8 APY
- 180 gün: %12 APY
- 365 gün: %15 APY

**Ana Fonksiyonlar:**

```solidity
function stake(uint256 _duration) external payable
function unstake(uint256 _stakeIndex) external
function claimRewards(uint256 _stakeIndex) external
function claimAllRewards() external
function getPendingRewards(address _user) external view returns (uint256)
function getUserStakes(address _user) external view returns (Stake[] memory)
```

### 2. CeloRewards.sol

Ödül dağıtımı ve talep etme için kullanılan contract.

**Özellikler:**

- Kullanıcılara ödül ekleme
- Toplu ödül dağıtımı
- Ödül talep etme
- Kısmi ödül talep etme
- Ödül geçmişi takibi
- Yetkilendirilmiş dağıtıcılar

**Ana Fonksiyonlar:**

```solidity
function addReward(address _user, uint256 _amount, string memory _source) external
function addRewardsBatch(address[] memory _users, uint256[] memory _amounts, string memory _source) external
function claimRewards() external
function claimPartialRewards(uint256 _amount) external
function getPendingRewards(address _user) external view returns (uint256)
function getUserRewards(address _user) external view returns (Reward[] memory)
```

## 🚀 Deployment

### Hardhat ile Deploy

```bash
# Alfajores testnet'e deploy
cd apps/contracts
npx hardhat ignition deploy ./ignition/modules/CeloStakingRewards.ts --network alfajores

# Veya tek tek deploy
npx hardhat ignition deploy ./ignition/modules/CeloStaking.ts --network alfajores
npx hardhat ignition deploy ./ignition/modules/CeloRewards.ts --network alfajores
```

### Deploy Sonrası

Deploy edilen contract adreslerini `apps/web/src/utils/celo-config.ts` dosyasındaki `CELO_CONTRACTS` objesine ekleyin:

```typescript
export const CELO_CONTRACTS = {
  alfajores: {
    staking: "0xYOUR_STAKING_CONTRACT_ADDRESS",
    rewards: "0xYOUR_REWARDS_CONTRACT_ADDRESS",
  },
  // ...
};
```

## 🔧 Contract Etkileşimi

### Staking Örneği

```typescript
import { parseEther } from "viem";
import { CELO_STAKING_ABI } from "@/utils/contract-abis";
import { getContractAddresses } from "@/utils/celo-config";

const contracts = getContractAddresses();

// 100 CELO stake et (30 gün)
const { request } = await publicClient.simulateContract({
  address: contracts.staking,
  abi: CELO_STAKING_ABI,
  functionName: "stake",
  args: [30n], // 30 gün
  value: parseEther("100"),
  account: userAddress,
});

await walletClient.writeContract(request);
```

### Rewards Talep Etme

```typescript
import { CELO_REWARDS_ABI } from "@/utils/contract-abis";

// Tüm ödülleri talep et
const { request } = await publicClient.simulateContract({
  address: contracts.rewards,
  abi: CELO_REWARDS_ABI,
  functionName: "claimRewards",
  account: userAddress,
});

await walletClient.writeContract(request);
```

### Pending Rewards Sorgulama

```typescript
// Staking'den bekleyen ödüller
const stakingRewards = await publicClient.readContract({
  address: contracts.staking,
  abi: CELO_STAKING_ABI,
  functionName: "getPendingRewards",
  args: [userAddress],
});

// Rewards contract'tan bekleyen ödüller
const rewardsBalance = await publicClient.readContract({
  address: contracts.rewards,
  abi: CELO_REWARDS_ABI,
  functionName: "getPendingRewards",
  args: [userAddress],
});

console.log("Total Pending:", stakingRewards + rewardsBalance);
```

## 🧪 Test

Contract'ları test etmek için:

```bash
cd apps/contracts
npx hardhat test
```

Test dosyası oluşturmak için:

```typescript
// test/CeloStaking.test.ts
import { expect } from "chai";
import { ethers } from "hardhat";

describe("CeloStaking", function () {
  it("Should stake CELO successfully", async function () {
    const [owner, user] = await ethers.getSigners();
    const CeloStaking = await ethers.getContractFactory("CeloStaking");
    const staking = await CeloStaking.deploy();

    await staking.connect(user).stake(30, {
      value: ethers.parseEther("100"),
    });

    const stakes = await staking.getUserStakes(user.address);
    expect(stakes.length).to.equal(1);
    expect(stakes[0].amount).to.equal(ethers.parseEther("100"));
  });
});
```

## 🔐 Güvenlik

- Contract'lar OpenZeppelin standartlarına uygun yazılmıştır
- Owner fonksiyonları sadece contract sahibi tarafından çağrılabilir
- Emergency withdraw fonksiyonu sadece kritik durumlar için
- Rewards contract'ta yetkilendirilmiş dağıtıcılar sistemi var

## 📝 Notlar

- Contract'lar CELO native token ile çalışır
- Staking'de minimum lock süresi yoktur (esnek staking için)
- Ödüller saniye bazlı hesaplanır
- APY oranları contract owner tarafından güncellenebilir
- Rewards contract'a ödül eklemek için authorization gerekir

## 🎯 NLTE Entegrasyonu

Bu contract'lar NLTE (Natural Language Transaction Engine) ile entegre edilmelidir:

1. `transaction-helpers.ts` dosyasında STAKE ve CLAIM_REWARDS intent'leri için transaction builder fonksiyonları yazın
2. Contract ABI'lerini ve adreslerini import edin
3. Gas estimation ekleyin
4. UI'da transaction draft'ları gösterin

## 📚 Kaynaklar

- [Celo Documentation](https://docs.celo.org/)
- [Hardhat Documentation](https://hardhat.org/docs)
- [Viem Documentation](https://viem.sh/)
