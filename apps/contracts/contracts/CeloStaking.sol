// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title CeloStaking
 * @dev Simple staking contract for CELO tokens with flexible durations
 * @notice Users can stake CELO and earn rewards based on duration
 */
contract CeloStaking {
    
    // Struct to store stake information
    struct Stake {
        uint256 amount;          // Amount of CELO staked
        uint256 startTime;       // Timestamp when stake started
        uint256 duration;        // Duration in days
        uint256 rewardRate;      // APY percentage (e.g., 500 = 5%)
        bool active;             // Whether stake is still active
    }
    
    // Mapping from user address to their stakes
    mapping(address => Stake[]) public stakes;
    
    // Mapping from user address to their claimable rewards
    mapping(address => uint256) public pendingRewards;
    
    // Owner of the contract
    address public owner;
    
    // Total staked in contract
    uint256 public totalStaked;
    
    // Default APY rates based on duration (in basis points, e.g., 500 = 5%)
    mapping(uint256 => uint256) public durationToAPY;
    
    // Events
    event Staked(address indexed user, uint256 amount, uint256 duration, uint256 stakeIndex);
    event Unstaked(address indexed user, uint256 amount, uint256 reward, uint256 stakeIndex);
    event RewardsClaimed(address indexed user, uint256 amount);
    event APYUpdated(uint256 duration, uint256 newAPY);
    
    // Modifiers
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this");
        _;
    }
    
    constructor() {
        owner = msg.sender;
        
        // Set default APY rates (in basis points)
        durationToAPY[0] = 300;      // Flexible staking: 3% APY
        durationToAPY[30] = 500;     // 30 days: 5% APY
        durationToAPY[90] = 800;     // 90 days: 8% APY
        durationToAPY[180] = 1200;   // 180 days: 12% APY
        durationToAPY[365] = 1500;   // 365 days: 15% APY
    }
    
    /**
     * @dev Stake CELO tokens
     * @param _duration Duration in days (0 for flexible staking)
     */
    function stake(uint256 _duration) external payable {
        require(msg.value > 0, "Cannot stake 0 CELO");
        
        // Get APY rate for duration (use flexible rate if exact match not found)
        uint256 rewardRate = durationToAPY[_duration];
        if (rewardRate == 0 && _duration > 0) {
            rewardRate = durationToAPY[0]; // Default to flexible rate
        }
        
        // Create new stake
        stakes[msg.sender].push(Stake({
            amount: msg.value,
            startTime: block.timestamp,
            duration: _duration,
            rewardRate: rewardRate,
            active: true
        }));
        
        totalStaked += msg.value;
        
        emit Staked(msg.sender, msg.value, _duration, stakes[msg.sender].length - 1);
    }
    
    /**
     * @dev Unstake CELO tokens and claim rewards
     * @param _stakeIndex Index of the stake to unstake
     */
    function unstake(uint256 _stakeIndex) external {
        require(_stakeIndex < stakes[msg.sender].length, "Invalid stake index");
        Stake storage userStake = stakes[msg.sender][_stakeIndex];
        require(userStake.active, "Stake already withdrawn");
        
        // Check if lock period has passed
        uint256 lockEndTime = userStake.startTime + (userStake.duration * 1 days);
        if (userStake.duration > 0) {
            require(block.timestamp >= lockEndTime, "Stake is still locked");
        }
        
        // Calculate rewards
        uint256 reward = calculateReward(msg.sender, _stakeIndex);
        uint256 totalAmount = userStake.amount + reward;
        
        // Mark stake as inactive
        userStake.active = false;
        totalStaked -= userStake.amount;
        
        // Transfer tokens back to user
        require(address(this).balance >= totalAmount, "Insufficient contract balance");
        (bool success, ) = msg.sender.call{value: totalAmount}("");
        require(success, "Transfer failed");
        
        emit Unstaked(msg.sender, userStake.amount, reward, _stakeIndex);
    }
    
    /**
     * @dev Calculate rewards for a specific stake
     * @param _user Address of the user
     * @param _stakeIndex Index of the stake
     * @return Calculated reward amount
     */
    function calculateReward(address _user, uint256 _stakeIndex) public view returns (uint256) {
        require(_stakeIndex < stakes[_user].length, "Invalid stake index");
        Stake memory userStake = stakes[_user][_stakeIndex];
        
        if (!userStake.active) {
            return 0;
        }
        
        uint256 stakingDuration = block.timestamp - userStake.startTime;
        
        // Calculate reward: (amount * APY * time) / (365 days * 10000)
        // APY is in basis points (e.g., 500 = 5%)
        uint256 reward = (userStake.amount * userStake.rewardRate * stakingDuration) / (365 days * 10000);
        
        return reward;
    }
    
    /**
     * @dev Get all stakes for a user
     * @param _user Address of the user
     * @return Array of all user stakes
     */
    function getUserStakes(address _user) external view returns (Stake[] memory) {
        return stakes[_user];
    }
    
    /**
     * @dev Get total pending rewards for a user across all stakes
     * @param _user Address of the user
     * @return Total pending rewards
     */
    function getPendingRewards(address _user) external view returns (uint256) {
        uint256 totalRewards = 0;
        
        for (uint256 i = 0; i < stakes[_user].length; i++) {
            if (stakes[_user][i].active) {
                totalRewards += calculateReward(_user, i);
            }
        }
        
        return totalRewards + pendingRewards[_user];
    }
    
    /**
     * @dev Claim accumulated rewards without unstaking
     * @param _stakeIndex Index of the stake to claim rewards from
     */
    function claimRewards(uint256 _stakeIndex) external {
        require(_stakeIndex < stakes[msg.sender].length, "Invalid stake index");
        Stake storage userStake = stakes[msg.sender][_stakeIndex];
        require(userStake.active, "Stake is not active");
        
        uint256 reward = calculateReward(msg.sender, _stakeIndex);
        require(reward > 0, "No rewards to claim");
        
        // Reset the reward calculation by updating start time
        userStake.startTime = block.timestamp;
        
        // Transfer rewards
        require(address(this).balance >= reward, "Insufficient contract balance");
        (bool success, ) = msg.sender.call{value: reward}("");
        require(success, "Transfer failed");
        
        emit RewardsClaimed(msg.sender, reward);
    }
    
    /**
     * @dev Claim all pending rewards from all active stakes
     */
    function claimAllRewards() external {
        uint256 totalRewards = 0;
        
        for (uint256 i = 0; i < stakes[msg.sender].length; i++) {
            if (stakes[msg.sender][i].active) {
                uint256 reward = calculateReward(msg.sender, i);
                if (reward > 0) {
                    stakes[msg.sender][i].startTime = block.timestamp;
                    totalRewards += reward;
                }
            }
        }
        
        // Add any pending rewards
        totalRewards += pendingRewards[msg.sender];
        pendingRewards[msg.sender] = 0;
        
        require(totalRewards > 0, "No rewards to claim");
        require(address(this).balance >= totalRewards, "Insufficient contract balance");
        
        (bool success, ) = msg.sender.call{value: totalRewards}("");
        require(success, "Transfer failed");
        
        emit RewardsClaimed(msg.sender, totalRewards);
    }
    
    /**
     * @dev Update APY for a specific duration
     * @param _duration Duration in days
     * @param _newAPY New APY in basis points (e.g., 500 = 5%)
     */
    function updateAPY(uint256 _duration, uint256 _newAPY) external onlyOwner {
        require(_newAPY <= 10000, "APY cannot exceed 100%");
        durationToAPY[_duration] = _newAPY;
        emit APYUpdated(_duration, _newAPY);
    }
    
    /**
     * @dev Fund the contract with CELO for rewards
     */
    function fundRewards() external payable onlyOwner {
        require(msg.value > 0, "Must send CELO");
    }
    
    /**
     * @dev Emergency withdraw (only owner)
     * @param _amount Amount to withdraw
     */
    function emergencyWithdraw(uint256 _amount) external onlyOwner {
        require(address(this).balance >= _amount, "Insufficient balance");
        (bool success, ) = owner.call{value: _amount}("");
        require(success, "Transfer failed");
    }
    
    /**
     * @dev Get contract balance
     * @return Contract balance in CELO
     */
    function getContractBalance() external view returns (uint256) {
        return address(this).balance;
    }
    
    /**
     * @dev Receive CELO
     */
    receive() external payable {}
}
