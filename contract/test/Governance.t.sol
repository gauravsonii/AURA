//SPDX-License-Identifier: MIT
pragma solidity ^0.8.29;

import "forge-std/Test.sol";
import {LiquidityPool} from "../src/LiquidityPool.sol";
import {Governance} from "../src/Governance.sol";
import {AuraGovernanceToken} from "../src/AuraGovernanceToken.sol";
import {TestTokens} from "../src/TestTokens.sol";
import {LPToken} from "../src/LPToken.sol";
contract GovernanceTest is Test {
    LiquidityPool pool;
    Governance gov;
    AuraGovernanceToken governanceToken;
    TestTokens tokenA;
    TestTokens tokenB;
    address voter1 = address(0x1);
    address voter2 = address(0x2);

    function setUp() public {
        tokenA = new TestTokens("TokenA","A");
        tokenB = new TestTokens("TokenB","B");
        governanceToken = new AuraGovernanceToken();
        LPToken lpToken = new LPToken(address(this));
        pool = new LiquidityPool(tokenA, tokenB, lpToken);
        lpToken.transferOwnership(address(pool));
        gov = new Governance(pool, governanceToken);
        pool.setGovernance(address(gov));
        governanceToken.mint(voter1, 10000 * 10**18);
        governanceToken.mint(voter2, 5000 * 10**18);
        governanceToken.mint(address(this), 20000 * 10**18);
        vm.prank(voter1);
        governanceToken.delegate(voter1);
        vm.prank(voter2);
        governanceToken.delegate(voter2);
        governanceToken.delegate(address(this));
    }

    function testCreateProposalIncrementsCountAndStoresData() public {
        gov.createProposal("set fee to 50", 50);
        assertEq(gov.proposalCount(), 1);
        (uint id, address proposer, uint yesVotes, uint noVotes, string memory description, bool executed, uint newFee, uint256 startTime, uint256 endTime) = gov.proposals(1);
        assertEq(id, 1);
        assertEq(proposer, address(this));
        assertEq(yesVotes, 0);
        assertEq(noVotes, 0);
        assertEq(keccak256(bytes(description)), keccak256(bytes("set fee to 50")));
        assertEq(executed, false);
        assertEq(newFee, 50);
        assertTrue(startTime > 0);
        assertTrue(endTime > startTime);
    }

    function testVoteAndPreventDoubleVote() public {
        gov.createProposal("p", 10);
        gov.vote(1, true);
        vm.expectRevert(bytes("Already voted"));
        gov.vote(1, true);
        (,,uint yesVotes,uint noVotes,,,,,) = gov.proposals(1);
        assertTrue(yesVotes > 0);
        assertEq(noVotes, 0);
    }

    function testVoteRevertsIfExecuted() public {
        gov.createProposal("p", 10);
        gov.vote(1, true);
        
        vm.warp(block.timestamp + 8 days);
        gov.executeProposal(1);
        vm.expectRevert(bytes("Proposal already executed"));
        gov.vote(1, true);
    }

    function testExecuteProposalAnyoneCanExecute() public {
        gov.createProposal("p", 40);
        gov.vote(1, true);
        vm.warp(block.timestamp + 8 days);
        vm.prank(voter1);
        gov.executeProposal(1);
        assertEq(pool.fee(), 40);
        (,,,,,bool executed,,,) = gov.proposals(1);
        assertEq(executed, true);
    }

    function testExecuteProposalFailsIfNotEnoughYes() public {
        gov.createProposal("p", 70);
        gov.vote(1, false);
        vm.warp(block.timestamp + 8 days);
        vm.expectRevert(bytes("Proposal failed"));
        gov.executeProposal(1);
    }

    function testExecuteProposalRevertsIfAlreadyExecuted() public {
        gov.createProposal("p", 20);
        gov.vote(1, true);
        vm.warp(block.timestamp + 8 days);
        gov.executeProposal(1);
        vm.expectRevert(bytes("Proposal already executed"));
        gov.executeProposal(1);
    }
    
    function testVotingPeriodEnforcement() public {
        gov.createProposal("p", 30);
        gov.vote(1, true);
        vm.warp(block.timestamp + 8 days);
        vm.expectRevert(bytes("Voting period ended"));
        vm.prank(voter1);
        gov.vote(1, true);
    }
    
    function testTokenBasedVoting() public {
        gov.createProposal("p", 50);
        vm.prank(voter1);
        gov.vote(1, true);
        vm.prank(voter2);
        gov.vote(1, false);
        (,,uint yesVotes, uint noVotes,,,,,) = gov.proposals(1);
        assertEq(yesVotes, 10000 * 10**18);
        assertEq(noVotes, 5000 * 10**18);
        vm.warp(block.timestamp + 8 days);
        gov.executeProposal(1);
        assertEq(pool.fee(), 50);
    }
    
    function testMinimumTokenRequirement() public {
        address poorUser = address(0x999);
        governanceToken.mint(poorUser, 100 * 10**18);
        vm.prank(poorUser);
        vm.expectRevert(bytes("Insufficient balance to create proposal"));
        gov.createProposal("p", 10);
    }
}


