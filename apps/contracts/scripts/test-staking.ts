import hre from "hardhat";
import { formatEther, parseEther } from "viem";

async function main() {
  console.log("🔍 Testing CeloStaking Contract...\n");

  const publicClient = await hre.viem.getPublicClient();
  const [deployer] = await hre.viem.getWalletClients();
  
  const stakingAddress = "0x7b18750f69a8034463dde05c29637316cf349aa6";
  
  console.log("Contract Address:", stakingAddress);
  console.log("Test Account:", deployer.account.address);
  
  // Check if contract exists
  const code = await publicClient.getBytecode({ address: stakingAddress });
  console.log("\n✅ Contract exists:", code ? "Yes" : "No");
  
  if (!code) {
    console.log("❌ Contract not deployed at this address!");
    return;
  }
  
  // Get contract instance
  const staking = await hre.viem.getContractAt("CeloStaking", stakingAddress);
  
  try {
    // Check owner
    const owner = await staking.read.owner();
    console.log("Contract Owner:", owner);
    
    // Check total staked
    const totalStaked = await staking.read.totalStaked();
    console.log("Total Staked:", formatEther(totalStaked), "CELO");
    
    // Check APY rates
    console.log("\nAPY Rates:");
    const durations = [0, 30, 90, 180, 365];
    for (const duration of durations) {
      const apy = await staking.read.durationToAPY([BigInt(duration)]);
      console.log(`  ${duration} days: ${Number(apy) / 100}%`);
    }
    
    // Check user stakes
    const userStakes = await staking.read.getUserStakes([deployer.account.address]);
    console.log("\nYour Stakes:", userStakes.length);
    
    if (userStakes.length > 0) {
      userStakes.forEach((stake: any, index: number) => {
        console.log(`\nStake #${index}:`);
        console.log(`  Amount: ${formatEther(stake.amount)} CELO`);
        console.log(`  Duration: ${stake.duration} days`);
        console.log(`  Active: ${stake.active}`);
      });
    }
    
    // Try to simulate a stake transaction
    console.log("\n🧪 Testing stake simulation...");
    try {
      await publicClient.simulateContract({
        address: stakingAddress,
        abi: (await hre.artifacts.readArtifact("CeloStaking")).abi,
        functionName: 'stake',
        args: [0n],
        value: parseEther("0.1"),
        account: deployer.account.address,
      });
      console.log("✅ Stake simulation successful!");
    } catch (simError: any) {
      console.log("❌ Stake simulation failed:", simError.message);
      if (simError.cause) {
        console.log("   Cause:", simError.cause);
      }
    }
    
  } catch (error: any) {
    console.error("❌ Error:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
