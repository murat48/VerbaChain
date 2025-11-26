import hre from "hardhat";
import { formatEther } from "viem";

async function main() {
  console.log("🚀 Starting deployment...\n");

  // Get public client
  const publicClient = await hre.viem.getPublicClient();
  const [deployer] = await hre.viem.getWalletClients();
  
  console.log("Deploying contracts with account:", deployer.account.address);
  const balance = await publicClient.getBalance({ address: deployer.account.address });
  console.log("Account balance:", formatEther(balance), "CELO\n");

  // Deploy CeloStaking
  console.log("📦 Deploying CeloStaking...");
  const celoStaking = await hre.viem.deployContract("CeloStaking");
  const stakingAddress = celoStaking.address;
  console.log("✅ CeloStaking deployed to:", stakingAddress);

  // Deploy CeloRewards
  console.log("\n📦 Deploying CeloRewards...");
  const celoRewards = await hre.viem.deployContract("CeloRewards");
  const rewardsAddress = celoRewards.address;
  console.log("✅ CeloRewards deployed to:", rewardsAddress);

  // Get network info
  const chainId = await publicClient.getChainId();

  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("📋 Deployment Summary");
  console.log("=".repeat(60));
  console.log("Chain ID:", chainId);
  console.log("Deployer:", deployer.account.address);
  console.log("\nContract Addresses:");
  console.log("  CeloStaking:", stakingAddress);
  console.log("  CeloRewards:", rewardsAddress);
  console.log("=".repeat(60));

  console.log("\n📝 Update these addresses in apps/web/src/utils/celo-config.ts:");
  console.log(`
  sepolia: {
    staking: '${stakingAddress}',
    rewards: '${rewardsAddress}',
  },
  `);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
