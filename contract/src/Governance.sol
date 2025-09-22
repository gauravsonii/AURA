//SPDX-License-Identifier: MIT
pragma solidity ^0.8.29;

import {LiquidityPool} from "./LiquidityPool.sol";
import {AuraGovernanceToken} from "./AuraGovernanceToken.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract Governance is Ownable(msg.sender) {
    LiquidityPool public pool;
    AuraGovernanceToken public governanceToken;
    uint256 public constant VOTING_PERIOD = 7 days;
    uint public proposalCount;
    
    struct Proposal {
        uint id;
        address proposer;
        uint yesVotes;
        uint noVotes;
        string description;
        bool executed;
        uint newFee;
        uint256 startTime;
        uint256 endTime;
    }
    
    mapping(uint => mapping(address => bool)) public hasVoted;
    mapping(uint => Proposal) public proposals;

    event ProposalCreated(uint id, address proposer, string description, uint newFee, uint256 startTime, uint256 endTime);
    event VoteCast(uint proposalId, address voter, bool support, uint256 votes);
    event ProposalExecuted(uint id);

    constructor(LiquidityPool _pool, AuraGovernanceToken _governanceToken) {
        pool = _pool;
        governanceToken = _governanceToken;
    }

    function createProposal(string memory description, uint newFee) external {
        require(governanceToken.balanceOf(msg.sender) >= 1000 * 10**governanceToken.decimals(), "Insufficient balance to create proposal");
        
        proposalCount++;
        uint256 startTime = block.timestamp;
        uint256 endTime = startTime + VOTING_PERIOD;
        
        proposals[proposalCount] = Proposal({
            id: proposalCount,
            proposer: msg.sender,
            yesVotes: 0,
            noVotes: 0,
            description: description,
            executed: false,
            newFee: newFee,
            startTime: startTime,
            endTime: endTime
        });
        
        emit ProposalCreated(proposalCount, msg.sender, description, newFee, startTime, endTime);
    }
    
    function vote(uint proposalId, bool support) external {
        Proposal storage proposal = proposals[proposalId];
        
        require(proposal.id != 0, "Proposal does not exist");
        require(!proposal.executed, "Proposal already executed");
        require(block.timestamp >= proposal.startTime, "Voting not started");
        require(block.timestamp <= proposal.endTime, "Voting period ended");
        require(!hasVoted[proposalId][msg.sender], "Already voted");
        
        uint256 votingPower = governanceToken.getVotes(msg.sender);
        require(votingPower > 0, "No voting power");
        
        hasVoted[proposalId][msg.sender] = true;
        
        if (support) {
            proposal.yesVotes += votingPower;
        } else {
            proposal.noVotes += votingPower;
        }
        
        emit VoteCast(proposalId, msg.sender, support, votingPower);
    }
    
    function executeProposal(uint proposalId) external {
        Proposal storage proposal = proposals[proposalId];
        
        require(proposal.id != 0, "Proposal does not exist");
        require(!proposal.executed, "Proposal already executed");
        require(block.timestamp > proposal.endTime, "Voting period not ended");
        require(proposal.yesVotes > proposal.noVotes, "Proposal failed");
        
        proposal.executed = true;
        pool.setNewFee(proposal.newFee);
        
        emit ProposalExecuted(proposalId);
    }
    
    function isExecutable(uint proposalId) external view returns (bool) {
        Proposal storage proposal = proposals[proposalId];
        
        return proposal.id != 0 && 
               !proposal.executed && 
               block.timestamp > proposal.endTime && 
               proposal.yesVotes > proposal.noVotes;
    }
    
    function getProposalStatus(uint proposalId) external view returns (
        bool exists,
        bool executed,
        bool votingActive,
        bool canExecute,
        uint256 yesVotes,
        uint256 noVotes
    ) {
        Proposal storage proposal = proposals[proposalId];
        
        exists = proposal.id != 0;
        executed = proposal.executed;
        votingActive = block.timestamp >= proposal.startTime && block.timestamp <= proposal.endTime;
        canExecute = exists && !executed && block.timestamp > proposal.endTime && proposal.yesVotes > proposal.noVotes;
        yesVotes = proposal.yesVotes;
        noVotes = proposal.noVotes;
    }
}

