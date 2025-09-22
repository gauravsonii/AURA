//SPDX-License-Identifier: MIT
pragma solidity ^0.8.29;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract MagicLinkEscrow is Ownable, ReentrancyGuard {
    using SafeERC20 for ERC20;

    struct Escrow {
        address token;
        address sender;
        uint256 amount;
        uint256 expirationTime;
        bool claimed;
        bool cancelled;
        bytes32 secretHash;
    }

    uint256 public escrowCount;
    mapping(uint256 => Escrow) public escrows;
    mapping(bytes32 => bool) public usedSecrets;
    mapping(address => uint256[]) public userEscrows;
    
    uint256 public constant DEFAULT_EXPIRATION = 30 days;
    uint256 public constant MAX_EXPIRATION = 365 days;
    
    event EscrowCreated(
        uint256 indexed escrowId,
        address indexed sender,
        address token,
        uint256 amount,
        uint256 expirationTime,
        bytes32 secretHash
    );
    
    event EscrowClaimed(
        uint256 indexed escrowId,
        address indexed recipient,
        uint256 amount
    );
    
    event EscrowCancelled(
        uint256 indexed escrowId,
        address indexed sender,
        uint256 amount
    );
    
    event EscrowExpired(
        uint256 indexed escrowId,
        address indexed sender,
        uint256 amount
    );

    constructor() Ownable(msg.sender) {}

    /**
     * @dev Create a new escrow with a magic link
     * @param token The token to escrow (address(0) for ETH)
     * @param amount The amount to escrow
     * @param expirationTime When the escrow expires (0 for default)
     * @param secretHash Hash of the secret that will be used to claim
     */
    function createEscrow(
        address token,
        uint256 amount,
        uint256 expirationTime,
        bytes32 secretHash
    ) external payable nonReentrant {
        require(amount > 0, "Invalid amount");
        require(secretHash != bytes32(0), "Invalid secret hash");
        require(!usedSecrets[secretHash], "Secret already used");
        
        if (expirationTime == 0) {
            expirationTime = block.timestamp + DEFAULT_EXPIRATION;
        } else {
            require(expirationTime <= block.timestamp + MAX_EXPIRATION, "Expiration too far");
            require(expirationTime > block.timestamp, "Expiration in past");
        }
        
        if (token == address(0)) {
            // ETH escrow
            require(msg.value == amount, "ETH amount mismatch");
        } else {
            // ERC20 escrow
            require(msg.value == 0, "No ETH for token escrow");
            ERC20(token).safeTransferFrom(msg.sender, address(this), amount);
        }
        
        escrowCount++;
        escrows[escrowCount] = Escrow({
            token: token,
            sender: msg.sender,
            amount: amount,
            expirationTime: expirationTime,
            claimed: false,
            cancelled: false,
            secretHash: secretHash
        });
        
        usedSecrets[secretHash] = true;
        userEscrows[msg.sender].push(escrowCount);
        
        emit EscrowCreated(
            escrowCount,
            msg.sender,
            token,
            amount,
            expirationTime,
            secretHash
        );
    }

    /**
     * @dev Claim an escrow using the secret
     * @param escrowId The ID of the escrow to claim
     * @param secret The secret to prove ownership
     */
    function claimEscrow(uint256 escrowId, bytes32 secret) external nonReentrant {
        Escrow storage escrow = escrows[escrowId];
        
        require(escrow.sender != address(0), "Escrow not found");
        require(!escrow.claimed, "Already claimed");
        require(!escrow.cancelled, "Escrow cancelled");
        require(block.timestamp <= escrow.expirationTime, "Escrow expired");
        require(keccak256(abi.encodePacked(secret)) == escrow.secretHash, "Invalid secret");
        
        escrow.claimed = true;
        
        if (escrow.token == address(0)) {
            // ETH transfer
            (bool success, ) = msg.sender.call{value: escrow.amount}("");
            require(success, "ETH transfer failed");
        } else {
            // ERC20 transfer
            ERC20(escrow.token).safeTransfer(msg.sender, escrow.amount);
        }
        
        emit EscrowClaimed(escrowId, msg.sender, escrow.amount);
    }

    /**
     * @dev Cancel an escrow (only sender can cancel)
     * @param escrowId The ID of the escrow to cancel
     */
    function cancelEscrow(uint256 escrowId) external nonReentrant {
        Escrow storage escrow = escrows[escrowId];
        
        require(escrow.sender == msg.sender, "Not sender");
        require(!escrow.claimed, "Already claimed");
        require(!escrow.cancelled, "Already cancelled");
        
        escrow.cancelled = true;
        
        if (escrow.token == address(0)) {
            // ETH refund
            (bool success, ) = escrow.sender.call{value: escrow.amount}("");
            require(success, "ETH refund failed");
        } else {
            // ERC20 refund
            ERC20(escrow.token).safeTransfer(escrow.sender, escrow.amount);
        }
        
        emit EscrowCancelled(escrowId, escrow.sender, escrow.amount);
    }

    /**
     * @dev Expire an escrow and refund to sender (anyone can call after expiration)
     * @param escrowId The ID of the escrow to expire
     */
    function expireEscrow(uint256 escrowId) external nonReentrant {
        Escrow storage escrow = escrows[escrowId];
        
        require(escrow.sender != address(0), "Escrow not found");
        require(!escrow.claimed, "Already claimed");
        require(!escrow.cancelled, "Already cancelled");
        require(block.timestamp > escrow.expirationTime, "Not expired yet");
        
        escrow.cancelled = true;
        
        if (escrow.token == address(0)) {
            // ETH refund
            (bool success, ) = escrow.sender.call{value: escrow.amount}("");
            require(success, "ETH refund failed");
        } else {
            // ERC20 refund
            ERC20(escrow.token).safeTransfer(escrow.sender, escrow.amount);
        }
        
        emit EscrowExpired(escrowId, escrow.sender, escrow.amount);
    }

    /**
     * @dev Get escrow details
     * @param escrowId The ID of the escrow
     */
    function getEscrow(uint256 escrowId) external view returns (
        address token,
        address sender,
        uint256 amount,
        uint256 expirationTime,
        bool claimed,
        bool cancelled,
        bytes32 secretHash
    ) {
        Escrow storage escrow = escrows[escrowId];
        return (
            escrow.token,
            escrow.sender,
            escrow.amount,
            escrow.expirationTime,
            escrow.claimed,
            escrow.cancelled,
            escrow.secretHash
        );
    }

    /**
     * @dev Get user's escrow IDs
     * @param user The user address
     */
    function getUserEscrows(address user) external view returns (uint256[] memory) {
        return userEscrows[user];
    }

    /**
     * @dev Check if an escrow is claimable
     * @param escrowId The ID of the escrow
     */
    function isClaimable(uint256 escrowId) external view returns (bool) {
        Escrow storage escrow = escrows[escrowId];
        return escrow.sender != address(0) && 
               !escrow.claimed && 
               !escrow.cancelled && 
               block.timestamp <= escrow.expirationTime;
    }

    /**
     * @dev Check if an escrow is expired
     * @param escrowId The ID of the escrow
     */
    function isExpired(uint256 escrowId) external view returns (bool) {
        Escrow storage escrow = escrows[escrowId];
        return escrow.sender != address(0) && 
               !escrow.claimed && 
               !escrow.cancelled && 
               block.timestamp > escrow.expirationTime;
    }

    /**
     * @dev Emergency function to recover stuck tokens (only owner)
     * @param token The token to recover (address(0) for ETH)
     * @param amount The amount to recover
     */
    function emergencyRecover(address token, uint256 amount) external onlyOwner {
        if (token == address(0)) {
            (bool success, ) = owner().call{value: amount}("");
            require(success, "ETH recovery failed");
        } else {
            ERC20(token).safeTransfer(owner(), amount);
        }
    }

    // Allow contract to receive ETH
    receive() external payable {}
}
