//SPDX-License-Identifier: MIT
pragma solidity ^0.8.29;

import "forge-std/Test.sol";
import {MagicLinkEscrow} from "../src/MagicLinkEscrow.sol";
import {TestTokens} from "../src/TestTokens.sol";

contract MagicLinkEscrowTest is Test {
    MagicLinkEscrow escrow;
    TestTokens token;
    
    address sender = address(0x1);
    address recipient = address(0x2);
    address thirdParty = address(0x3);
    
    bytes32 secret = "mySecret123"; // Raw secret as bytes32
    bytes32 secretHash = keccak256(abi.encodePacked(secret)); // Hash of the secret
    
    function setUp() public {
        escrow = new MagicLinkEscrow();
        token = new TestTokens("Test Token", "TEST");
        
        // Mint tokens to sender
        token.mint(sender, 1000 ether);
        
        // Approve escrow to spend tokens
        vm.prank(sender);
        token.approve(address(escrow), type(uint256).max);
    }

    function testCreateETHEscrow() public {
        uint256 amount = 1 ether;
        uint256 expirationTime = block.timestamp + 7 days;
        
        vm.deal(sender, amount);
        vm.prank(sender);
        escrow.createEscrow{value: amount}(
            address(0),
            amount,
            expirationTime,
            secretHash
        );
        
        assertEq(escrow.escrowCount(), 1);
        (address tokenAddr, address senderAddr, uint256 escrowAmount, uint256 expTime, bool claimed, bool cancelled, bytes32 hash) = escrow.getEscrow(1);
        
        assertEq(tokenAddr, address(0));
        assertEq(senderAddr, sender);
        assertEq(escrowAmount, amount);
        assertEq(expTime, expirationTime);
        assertEq(claimed, false);
        assertEq(cancelled, false);
        assertEq(hash, secretHash);
    }

    function testCreateTokenEscrow() public {
        uint256 amount = 100 ether;
        uint256 expirationTime = block.timestamp + 7 days;
        
        vm.prank(sender);
        escrow.createEscrow(
            address(token),
            amount,
            expirationTime,
            secretHash
        );
        
        assertEq(escrow.escrowCount(), 1);
        assertEq(token.balanceOf(address(escrow)), amount);
        assertEq(token.balanceOf(sender), 900 ether);
    }

    function testCreateEscrowWithDefaultExpiration() public {
        uint256 amount = 1 ether;
        
        vm.deal(sender, amount);
        vm.prank(sender);
        escrow.createEscrow{value: amount}(address(0), amount, 0, // Default expiration
            secretHash
        );
        
        (, , , uint256 expTime, , , ) = escrow.getEscrow(1);
        assertEq(expTime, block.timestamp + 30 days); // DEFAULT_EXPIRATION
    }

    function testClaimETHEscrow() public {
        uint256 amount = 1 ether;
        
        vm.deal(sender, amount);
        vm.prank(sender);
        escrow.createEscrow{value: amount}(address(0), amount, block.timestamp + 7 days, secretHash
        );
        
        uint256 recipientBalanceBefore = recipient.balance;
        
        vm.prank(recipient);
        escrow.claimEscrow(1, secret);
        
        assertEq(recipient.balance, recipientBalanceBefore + amount);
        (, , , , bool claimed, , ) = escrow.getEscrow(1);
        assertEq(claimed, true);
    }

    function testClaimTokenEscrow() public {
        uint256 amount = 100 ether;
        
        vm.prank(sender);
        escrow.createEscrow(address(token), amount, block.timestamp + 7 days, secretHash
        );
        
        uint256 recipientBalanceBefore = token.balanceOf(recipient);
        
        vm.prank(recipient);
        escrow.claimEscrow(1, secret);
        
        assertEq(token.balanceOf(recipient), recipientBalanceBefore + amount);
        assertEq(token.balanceOf(address(escrow)), 0);
    }

    function testCancelETHEscrow() public {
        uint256 amount = 1 ether;
        
        vm.deal(sender, amount);
        vm.prank(sender);
        escrow.createEscrow{value: amount}(address(0), amount, block.timestamp + 7 days, secretHash
        );
        
        uint256 senderBalanceBefore = sender.balance;
        
        vm.prank(sender);
        escrow.cancelEscrow(1);
        
        assertEq(sender.balance, senderBalanceBefore + amount);
        (, , , , , bool cancelled, ) = escrow.getEscrow(1);
        assertEq(cancelled, true);
    }

    function testCancelTokenEscrow() public {
        uint256 amount = 100 ether;
        
        vm.prank(sender);
        escrow.createEscrow(address(token), amount, block.timestamp + 7 days, secretHash
        );
        
        uint256 senderBalanceBefore = token.balanceOf(sender);
        
        vm.prank(sender);
        escrow.cancelEscrow(1);
        
        assertEq(token.balanceOf(sender), senderBalanceBefore + amount);
        assertEq(token.balanceOf(address(escrow)), 0);
    }

    function testExpireETHEscrow() public {
        uint256 amount = 1 ether;
        
        vm.deal(sender, amount);
        vm.prank(sender);
        escrow.createEscrow{value: amount}(address(0), amount, block.timestamp + 1 days, secretHash
        );
        
        vm.warp(block.timestamp + 2 days);
        
        uint256 senderBalanceBefore = sender.balance;
        
        vm.prank(thirdParty);
        escrow.expireEscrow(1);
        
        assertEq(sender.balance, senderBalanceBefore + amount);
        (, , , , , bool cancelled, ) = escrow.getEscrow(1);
        assertEq(cancelled, true);
    }

    function testExpireTokenEscrow() public {
        uint256 amount = 100 ether;
        
        vm.prank(sender);
        escrow.createEscrow(address(token), amount, block.timestamp + 1 days, secretHash
        );
        
        vm.warp(block.timestamp + 2 days);
        
        uint256 senderBalanceBefore = token.balanceOf(sender);
        
        vm.prank(thirdParty);
        escrow.expireEscrow(1);
        
        assertEq(token.balanceOf(sender), senderBalanceBefore + amount);
        assertEq(token.balanceOf(address(escrow)), 0);
    }

    function testInvalidSecretReverts() public {
        uint256 amount = 1 ether;
        
        vm.deal(sender, amount);
        vm.prank(sender);
        escrow.createEscrow{value: amount}(address(0), amount, block.timestamp + 7 days, secretHash
        );
        
        vm.prank(recipient);
        vm.expectRevert(bytes("Invalid secret"));
        escrow.claimEscrow(1, "wrongSecret");
    }

    function testClaimExpiredEscrowReverts() public {
        uint256 amount = 1 ether;
        
        vm.deal(sender, amount);
        vm.prank(sender);
        escrow.createEscrow{value: amount}(address(0), amount, block.timestamp + 1 days, secretHash
        );
        
        vm.warp(block.timestamp + 2 days);
        
        vm.prank(recipient);
        vm.expectRevert(bytes("Escrow expired"));
        escrow.claimEscrow(1, secret);
    }

    function testClaimCancelledEscrowReverts() public {
        uint256 amount = 1 ether;
        
        vm.deal(sender, amount);
        vm.prank(sender);
        escrow.createEscrow{value: amount}(address(0), amount, block.timestamp + 7 days, secretHash
        );
        
        vm.prank(sender);
        escrow.cancelEscrow(1);
        
        vm.prank(recipient);
        vm.expectRevert(bytes("Escrow cancelled"));
        escrow.claimEscrow(1, secret);
    }

    function testDoubleClaimReverts() public {
        uint256 amount = 1 ether;
        
        vm.deal(sender, amount);
        vm.prank(sender);
        escrow.createEscrow{value: amount}(address(0), amount, block.timestamp + 7 days, secretHash
        );
        
        vm.prank(recipient);
        escrow.claimEscrow(1, secret);
        
        vm.prank(recipient);
        vm.expectRevert(bytes("Already claimed"));
        escrow.claimEscrow(1, secret);
    }

    function testNonSenderCancelReverts() public {
        uint256 amount = 1 ether;
        
        vm.deal(sender, amount);
        vm.prank(sender);
        escrow.createEscrow{value: amount}(address(0), amount, block.timestamp + 7 days, secretHash
        );
        
        vm.prank(recipient);
        vm.expectRevert(bytes("Not sender"));
        escrow.cancelEscrow(1);
    }

    function testExpireBeforeExpirationReverts() public {
        uint256 amount = 1 ether;
        
        vm.deal(sender, amount);
        vm.prank(sender);
        escrow.createEscrow{value: amount}(address(0), amount, block.timestamp + 7 days, secretHash
        );
        
        vm.prank(thirdParty);
        vm.expectRevert(bytes("Not expired yet"));
        escrow.expireEscrow(1);
    }

    function testCreateEscrowWithUsedSecretReverts() public {
        uint256 amount = 1 ether;
        
        vm.deal(sender, amount);
        vm.prank(sender);
        escrow.createEscrow{value: amount}(address(0), amount, block.timestamp + 7 days, secretHash
        );
        
        vm.deal(sender, amount * 2); // Need more ETH for second escrow
        vm.prank(sender);
        vm.expectRevert(bytes("Secret already used"));
        escrow.createEscrow{value: amount}(address(0), amount, block.timestamp + 7 days, secretHash
        );
    }

    function testCreateEscrowWithInvalidParameters() public {
        uint256 amount = 1 ether;
        
        vm.deal(sender, amount);
        
        // Invalid recipient
        vm.prank(sender);
        // Test invalid amount instead since recipient is removed
        vm.expectRevert(bytes("Invalid amount"));
        escrow.createEscrow{value: amount}(
            address(0),
            0, // Invalid amount
            block.timestamp + 7 days,
            secretHash
        );
        
        // Invalid amount
        vm.prank(sender);
        vm.expectRevert(bytes("Invalid amount"));
        escrow.createEscrow{value: amount}(address(0), 0, block.timestamp + 7 days, secretHash
        );
        
        // Invalid secret hash
        vm.prank(sender);
        vm.expectRevert(bytes("Invalid secret hash"));
        escrow.createEscrow{value: amount}(address(0), amount, block.timestamp + 7 days, bytes32(0)
        );
        
        // Expiration too far
        vm.prank(sender);
        vm.expectRevert(bytes("Expiration too far"));
        escrow.createEscrow{value: amount}(address(0), amount, block.timestamp + 400 days, secretHash
        );
    }

    function testIsClaimable() public {
        uint256 amount = 1 ether;
        
        vm.deal(sender, amount);
        vm.prank(sender);
        escrow.createEscrow{value: amount}(address(0), amount, block.timestamp + 7 days, secretHash
        );
        
        assertTrue(escrow.isClaimable(1));
        
        vm.warp(block.timestamp + 8 days);
        assertFalse(escrow.isClaimable(1));
    }

    function testIsExpired() public {
        uint256 amount = 1 ether;
        
        vm.deal(sender, amount);
        vm.prank(sender);
        escrow.createEscrow{value: amount}(address(0), amount, block.timestamp + 1 days, secretHash
        );
        
        assertFalse(escrow.isExpired(1));
        
        vm.warp(block.timestamp + 2 days);
        assertTrue(escrow.isExpired(1));
    }

    function testGetUserEscrows() public {
        uint256 amount = 1 ether;
        
        vm.deal(sender, amount);
        vm.prank(sender);
        escrow.createEscrow{value: amount}(address(0), amount, block.timestamp + 7 days, secretHash
        );
        
        uint256[] memory senderEscrows = escrow.getUserEscrows(sender);
        uint256[] memory recipientEscrows = escrow.getUserEscrows(recipient);
        
        assertEq(senderEscrows.length, 1);
        assertEq(recipientEscrows.length, 0); // Recipients are no longer tracked
        assertEq(senderEscrows[0], 1);
    }

    function testEmergencyRecover() public {
        uint256 amount = 1 ether;
        
        // Send ETH to contract directly using vm.deal
        vm.deal(address(escrow), amount);
        
        // Use a different address as the owner for this test
        address newOwner = address(0x999);
        vm.prank(address(this));
        escrow.transferOwnership(newOwner);
        
        uint256 newOwnerBalanceBefore = newOwner.balance;
        
        vm.prank(newOwner);
        escrow.emergencyRecover(address(0), amount);
        
        assertEq(newOwner.balance, newOwnerBalanceBefore + amount);
    }

    function testEmergencyRecoverToken() public {
        uint256 amount = 100 ether;
        
        // Mint tokens to this contract first
        token.mint(address(this), amount);
        
        // Send tokens to contract
        token.transfer(address(escrow), amount);
        
        uint256 ownerBalanceBefore = token.balanceOf(address(this));
        
        escrow.emergencyRecover(address(token), amount);
        
        assertEq(token.balanceOf(address(this)), ownerBalanceBefore + amount);
    }

    function testMultipleEscrows() public {
        uint256 amount = 1 ether;
        bytes32 secretHash2 = keccak256(abi.encodePacked("secret2"));
        
        vm.deal(sender, amount * 2);
        
        vm.prank(sender);
        escrow.createEscrow{value: amount}(address(0), amount, block.timestamp + 7 days, secretHash
        );
        
        vm.prank(sender);
        escrow.createEscrow{value: amount}(
            address(0),
            amount,
            block.timestamp + 7 days,
            secretHash2
        );
        
        assertEq(escrow.escrowCount(), 2);
        
        uint256[] memory senderEscrows = escrow.getUserEscrows(sender);
        assertEq(senderEscrows.length, 2);
    }

    function testReceiveETH() public {
        uint256 amount = 1 ether;
        
        vm.deal(address(this), amount);
        (bool success, ) = address(escrow).call{value: amount}("");
        assertTrue(success);
        assertEq(address(escrow).balance, amount);
    }
}
