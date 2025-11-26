import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

/**
 * Combined deployment module for both staking and rewards contracts
 */
const CeloStakingRewardsModule = buildModule("CeloStakingRewardsModule", (m) => {
  // Deploy CeloStaking contract
  const celoStaking = m.contract("CeloStaking", []);
  
  // Deploy CeloRewards contract
  const celoRewards = m.contract("CeloRewards", []);

  return { celoStaking, celoRewards };
});

export default CeloStakingRewardsModule;
