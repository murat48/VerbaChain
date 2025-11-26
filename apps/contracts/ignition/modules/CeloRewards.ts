import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

/**
 * Deployment module for CeloRewards contract
 */
const CeloRewardsModule = buildModule("CeloRewardsModule", (m) => {
  // Deploy CeloRewards contract
  const celoRewards = m.contract("CeloRewards", []);

  return { celoRewards };
});

export default CeloRewardsModule;
