// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title CeloRewards
 * @dev Standalone rewards distribution contract for CELO ecosystem
 * @notice Users can earn rewards through various activities and claim them
 */
contract CeloRewards {
    
    // Struct to store reward information
    struct Reward {
        uint256 amount;          // Amount of CELO reward
        uint256 timestamp;       // When the reward was earned
        string source;           // Source of reward (e.g., "staking", "liquidity", "governance")
        bool claimed;            // Whether reward has been claimed
    }
    
    // Mapping from user address to their rewards
    mapping(address => Reward[]) public userRewards;
    
    // Mapping from user address to total claimable amount
    mapping(address => uint256) public totalClaimable;
    
    // Mapping from user address to total claimed amount (history)
    mapping(address => uint256) public totalClaimed;
    
    // Owner of the contract
    address public owner;
    
    // Total rewards distributed
    uint256 public totalDistributed;
    
    // Total rewards claimed
    uint256 public totalClaimedGlobal;
    
    // Authorized reward distributors
    mapping(address => bool) public authorizedDistributors;
    
    // Events
    event RewardAdded(address indexed user, uint256 amount, string source);
    event RewardsClaimed(address indexed user, uint256 amount);
    event DistributorAdded(address indexed distributor);
    event DistributorRemoved(address indexed distributor);
    event RewardsFunded(address indexed funder, uint256 amount);
    
    // Modifiers
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this");
        _;
    }
    
    modifier onlyAuthorized() {
        require(msg.sender == owner || authorizedDistributors[msg.sender], "Not authorized");
        _;
    }
    
    constructor() {
        owner = msg.sender;
        authorizedDistributors[msg.sender] = true;
    }
    
    /**
     * @dev Add rewards for a user
     * @param _user Address of the user
     * @param _amount Amount of CELO reward
     * @param _source Source of the reward
     */
    function addReward(address _user, uint256 _amount, string memory _source) external onlyAuthorized {
        require(_user != address(0), "Invalid user address");
        require(_amount > 0, "Reward amount must be greater than 0");
        
        userRewards[_user].push(Reward({
            amount: _amount,
            timestamp: block.timestamp,
            source: _source,
            claimed: false
        }));
        
        totalClaimable[_user] += _amount;
        totalDistributed += _amount;
        
        emit RewardAdded(_user, _amount, _source);
    }
    
    /**
     * @dev Batch add rewards to multiple users
     * @param _users Array of user addresses
     * @param _amounts Array of reward amounts
     * @param _source Source of the rewards
     */
    function addRewardsBatch(
        address[] memory _users,
        uint256[] memory _amounts,
        string memory _source
    ) external onlyAuthorized {
        require(_users.length == _amounts.length, "Arrays length mismatch");
        require(_users.length > 0, "Empty arrays");
        
        for (uint256 i = 0; i < _users.length; i++) {
            require(_users[i] != address(0), "Invalid user address");
            require(_amounts[i] > 0, "Invalid amount");
            
            userRewards[_users[i]].push(Reward({
                amount: _amounts[i],
                timestamp: block.timestamp,
                source: _source,
                claimed: false
            }));
            
            totalClaimable[_users[i]] += _amounts[i];
            totalDistributed += _amounts[i];
            
            emit RewardAdded(_users[i], _amounts[i], _source);
        }
    }
    
    /**
     * @dev Claim all pending rewards
     */
    function claimRewards() external {
        uint256 claimableAmount = totalClaimable[msg.sender];
        require(claimableAmount > 0, "No rewards to claim");
        require(address(this).balance >= claimableAmount, "Insufficient contract balance");
        
        // Mark all rewards as claimed
        for (uint256 i = 0; i < userRewards[msg.sender].length; i++) {
            if (!userRewards[msg.sender][i].claimed) {
                userRewards[msg.sender][i].claimed = true;
            }
        }
        
        // Update balances
        totalClaimable[msg.sender] = 0;
        totalClaimed[msg.sender] += claimableAmount;
        totalClaimedGlobal += claimableAmount;
        
        // Transfer rewards
        (bool success, ) = msg.sender.call{value: claimableAmount}("");
        require(success, "Transfer failed");
        
        emit RewardsClaimed(msg.sender, claimableAmount);
    }
    
    /**
     * @dev Claim specific amount of rewards
     * @param _amount Amount to claim
     */
    function claimPartialRewards(uint256 _amount) external {
        require(_amount > 0, "Invalid amount");
        require(totalClaimable[msg.sender] >= _amount, "Insufficient claimable amount");
        require(address(this).balance >= _amount, "Insufficient contract balance");
        
        uint256 remainingToClaim = _amount;
        
        // Mark rewards as claimed until we reach the requested amount
        for (uint256 i = 0; i < userRewards[msg.sender].length && remainingToClaim > 0; i++) {
            if (!userRewards[msg.sender][i].claimed) {
                uint256 rewardAmount = userRewards[msg.sender][i].amount;
                
                if (rewardAmount <= remainingToClaim) {
                    userRewards[msg.sender][i].claimed = true;
                    remainingToClaim -= rewardAmount;
                } else {
                    // Split the reward
                    userRewards[msg.sender][i].amount -= remainingToClaim;
                    remainingToClaim = 0;
                }
            }
        }
        
        // Update balances
        totalClaimable[msg.sender] -= _amount;
        totalClaimed[msg.sender] += _amount;
        totalClaimedGlobal += _amount;
        
        // Transfer rewards
        (bool success, ) = msg.sender.call{value: _amount}("");
        require(success, "Transfer failed");
        
        emit RewardsClaimed(msg.sender, _amount);
    }
    
    /**
     * @dev Get all rewards for a user
     * @param _user Address of the user
     * @return Array of user rewards
     */
    function getUserRewards(address _user) external view returns (Reward[] memory) {
        return userRewards[_user];
    }
    
    /**
     * @dev Get unclaimed rewards for a user
     * @param _user Address of the user
     * @return Array of unclaimed rewards
     */
    function getUnclaimedRewards(address _user) external view returns (Reward[] memory) {
        uint256 unclaimedCount = 0;
        
        // Count unclaimed rewards
        for (uint256 i = 0; i < userRewards[_user].length; i++) {
            if (!userRewards[_user][i].claimed) {
                unclaimedCount++;
            }
        }
        
        // Create array of unclaimed rewards
        Reward[] memory unclaimed = new Reward[](unclaimedCount);
        uint256 currentIndex = 0;
        
        for (uint256 i = 0; i < userRewards[_user].length; i++) {
            if (!userRewards[_user][i].claimed) {
                unclaimed[currentIndex] = userRewards[_user][i];
                currentIndex++;
            }
        }
        
        return unclaimed;
    }
    
    /**
     * @dev Get pending rewards amount for a user
     * @param _user Address of the user
     * @return Pending rewards amount
     */
    function getPendingRewards(address _user) external view returns (uint256) {
        return totalClaimable[_user];
    }
    
    /**
     * @dev Get rewards history for a user
     * @param _user Address of the user
     * @return claimable Total claimable amount
     * @return claimed Total claimed amount
     * @return rewardsCount Total number of rewards
     */
    function getUserRewardsSummary(address _user) external view returns (
        uint256 claimable,
        uint256 claimed,
        uint256 rewardsCount
    ) {
        return (
            totalClaimable[_user],
            totalClaimed[_user],
            userRewards[_user].length
        );
    }
    
    /**
     * @dev Add authorized distributor
     * @param _distributor Address to authorize
     */
    function addDistributor(address _distributor) external onlyOwner {
        require(_distributor != address(0), "Invalid address");
        require(!authorizedDistributors[_distributor], "Already authorized");
        
        authorizedDistributors[_distributor] = true;
        emit DistributorAdded(_distributor);
    }
    
    /**
     * @dev Remove authorized distributor
     * @param _distributor Address to remove
     */
    function removeDistributor(address _distributor) external onlyOwner {
        require(authorizedDistributors[_distributor], "Not authorized");
        require(_distributor != owner, "Cannot remove owner");
        
        authorizedDistributors[_distributor] = false;
        emit DistributorRemoved(_distributor);
    }
    
    /**
     * @dev Fund the contract with CELO for rewards
     */
    function fundRewards() external payable {
        require(msg.value > 0, "Must send CELO");
        emit RewardsFunded(msg.sender, msg.value);
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
     * @dev Get global statistics
     * @return distributed Total rewards distributed
     * @return claimed Total rewards claimed
     * @return balance Current contract balance
     */
    function getGlobalStats() external view returns (
        uint256 distributed,
        uint256 claimed,
        uint256 balance
    ) {
        return (
            totalDistributed,
            totalClaimedGlobal,
            address(this).balance
        );
    }
    
    /**
     * @dev Receive CELO
     */
    receive() external payable {
        emit RewardsFunded(msg.sender, msg.value);
    }
}
