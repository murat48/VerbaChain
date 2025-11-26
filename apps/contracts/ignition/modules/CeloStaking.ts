import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

/**
 * Deployment module for CeloStaking contract
 */
const CeloStakingModule = buildModule("CeloStakingModule", (m) => {
  // Deploy CeloStaking contract
  const celoStaking = m.contract("CeloStaking", []);

  return { celoStaking };
});

export default CeloStakingModule;
