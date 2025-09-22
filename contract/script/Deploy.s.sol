//SPDX-License-Identifier: MIT
pragma solidity ^0.8.29;

import {Script, console} from "forge-std/Script.sol";
import {AuraGovernanceToken} from "../src/AuraGovernanceToken.sol";
import {Governance} from "../src/Governance.sol";
import {Launchpad} from "../src/Launchpad.sol";
import {LiquidityPool} from "../src/LiquidityPool.sol";
import {MagicLinkEscrow} from "../src/MagicLinkEscrow.sol";
import {TestTokens} from "../src/TestTokens.sol";
import {LPToken} from "../src/LPToken.sol";
/**
 * @title DeployAvalanche
 * @dev Complete deployment script for Avalanche Fuji Testnet
 * @notice Deploys all contracts and links them together properly
 */
contract DeployAvalanche is Script {
    // Contract instances
    AuraGovernanceToken public governanceToken;
    LiquidityPool public liquidityPool;
    Governance public governance;
    Launchpad public launchpad;
    MagicLinkEscrow public magicLinkEscrow;
    TestTokens public baseToken;
    LPToken public lpToken;
    
    // Deployment addresses
    address public deployer;
    
    // Avalanche Fuji Testnet configuration
    uint256 public constant FUJI_CHAIN_ID = 43113;
    
    function run() external {
        // Verify we're on the correct network
        require(block.chainid == FUJI_CHAIN_ID, "Not on Avalanche Fuji Testnet");
        
        deployer = msg.sender;
        
        console.log("============================================================");
        console.log("DEPLOYING TO AVALANCHE FUJI TESTNET");
        console.log("============================================================");
        console.log("Network: Avalanche Fuji Testnet");
        console.log("Chain ID:", block.chainid);
        console.log("Currency: AVAX");
        console.log("Deployer:", deployer);
        console.log("Deployer balance:", deployer.balance / 1e18, "AVAX");
        console.log("============================================================");
        
        
        // Deploy contracts in correct order
        _deployBaseToken();
        _deployGovernanceToken();
        _deployLPToken();
        _deployLiquidityPool();
        _deployGovernance();
        _deployLaunchpad();
        _deployMagicLinkEscrow();
        
        // Link contracts together
        _linkContracts();
        
        // Initialize contracts
        _initializeContracts();
        
        // Verify deployment
        _verifyDeployment();
        
        console.log("============================================================");
        console.log("DEPLOYMENT COMPLETED SUCCESSFULLY!");
        console.log("============================================================");
        _printDeploymentSummary();
    }
    
    function _deployBaseToken() internal {
        console.log("\n[1/6] Deploying Base Token (TestTokens)...");
        
        vm.startBroadcast();
        baseToken = new TestTokens("Test Token", "TEST");
        vm.stopBroadcast();
        
        console.log("Base Token deployed at:", address(baseToken));
        console.log("  Name:", baseToken.name());
        console.log("  Symbol:", baseToken.symbol());
        console.log("  Decimals:", baseToken.decimals());
    }
    
    function _deployGovernanceToken() internal {
        console.log("\n[2/6] Deploying Governance Token (AGOV)...");
        
        vm.startBroadcast();
        governanceToken = new AuraGovernanceToken();
        vm.stopBroadcast();
        
        console.log("Governance Token deployed at:", address(governanceToken));
        console.log("  Name:", governanceToken.name());
        console.log("  Symbol:", governanceToken.symbol());
        console.log("  Initial supply:", governanceToken.totalSupply() / 1e18, "AGOV");
    }
    
    function _deployLPToken() internal {
        console.log("\n[3/7] Deploying LP Token...");
        
        vm.startBroadcast();
        // Deploy LP Token with deployer as temporary owner, then transfer ownership to LiquidityPool
        lpToken = new LPToken(deployer);
        vm.stopBroadcast();
        
        console.log("LP Token deployed at:", address(lpToken));
        console.log("  Name:", lpToken.name());
        console.log("  Symbol:", lpToken.symbol());
    }
    
    function _deployLiquidityPool() internal {
        console.log("\n[4/7] Deploying Liquidity Pool...");
        
        vm.startBroadcast();
        liquidityPool = new LiquidityPool(baseToken, governanceToken, lpToken);
        vm.stopBroadcast();
        
        console.log("Liquidity Pool deployed at:", address(liquidityPool));
        console.log("  Token A (Base):", address(liquidityPool.tokenA()));
        console.log("  Token B (Governance):", address(liquidityPool.tokenB()));
        console.log("  LP Token:", address(liquidityPool.lpToken()));
        console.log("  Initial fee:", liquidityPool.fee(), "bps");
        
        // Transfer ownership of LP Token to LiquidityPool
        vm.startBroadcast();
        lpToken.transferOwnership(address(liquidityPool));
        vm.stopBroadcast();
        console.log("  LP Token ownership transferred to LiquidityPool");
    }
    
    function _deployGovernance() internal {
        console.log("\n[5/7] Deploying Governance...");
        
        vm.startBroadcast();
        governance = new Governance(liquidityPool, governanceToken);
        vm.stopBroadcast();
        
        console.log("Governance deployed at:", address(governance));
        console.log("  Linked Liquidity Pool:", address(governance.pool()));
        console.log("  Linked Governance Token:", address(governance.governanceToken()));
        console.log("  Voting Period:", governance.VOTING_PERIOD() / 86400, "days");
    }
    
    function _deployLaunchpad() internal {
        console.log("\n[6/7] Deploying Launchpad...");
        
        vm.startBroadcast();
        launchpad = new Launchpad(baseToken, liquidityPool);
        vm.stopBroadcast();
        
        console.log("Launchpad deployed at:", address(launchpad));
        console.log("  Base Token:", address(launchpad.baseToken()));
        console.log("  Liquidity Pool:", address(launchpad.liquidityPool()));
        console.log("  Launch Fee:", launchpad.LAUNCH_FEE(), "bps");
    }
    
    function _deployMagicLinkEscrow() internal {
        console.log("\n[7/7] Deploying Magic Link Escrow...");
        
        vm.startBroadcast();
        magicLinkEscrow = new MagicLinkEscrow();
        vm.stopBroadcast();
        
        console.log("Magic Link Escrow deployed at:", address(magicLinkEscrow));
        console.log("  Default Expiration:", magicLinkEscrow.DEFAULT_EXPIRATION() / 86400, "days");
        console.log("  Max Expiration:", magicLinkEscrow.MAX_EXPIRATION() / 86400, "days");
    }
    
    function _linkContracts() internal {
        console.log("\n[LINKING] Setting up contract relationships...");
        
        vm.startBroadcast();
        
        // Set governance in liquidity pool
        liquidityPool.setGovernance(address(governance));
        
        vm.stopBroadcast();
        
        console.log("Governance set in Liquidity Pool");
        console.log("All contracts properly linked");
    }
    
    function _initializeContracts() internal {
        console.log("\n[INITIALIZING] Setting up initial state...");
        
        vm.startBroadcast();
        
        // Transfer some governance tokens to deployer for testing
        uint256 transferAmount = 10000 * 10**governanceToken.decimals();
        governanceToken.transfer(deployer, transferAmount);
        
        // Delegate voting power to deployer
        governanceToken.delegate(deployer);
        
        vm.stopBroadcast();
        
        console.log("Transferred", transferAmount / 1e18, "governance tokens to deployer");
        console.log("Deployer voting power:", governanceToken.getVotes(deployer) / 1e18, "AGOV");
    }
    
    function _verifyDeployment() internal view {
        console.log("\n[VERIFYING] Checking deployment integrity...");
        
        // Verify governance token
        require(address(governanceToken) != address(0), "Governance token not deployed");
        require(governanceToken.totalSupply() > 0, "Governance token has no supply");
        
        // Verify liquidity pool
        require(address(liquidityPool) != address(0), "Liquidity pool not deployed");
        require(address(liquidityPool.tokenA()) == address(baseToken), "Wrong token A in liquidity pool");
        require(address(liquidityPool.tokenB()) == address(governanceToken), "Wrong token B in liquidity pool");
        require(address(liquidityPool.governance()) == address(governance), "Governance not set in liquidity pool");
        
        // Verify governance
        require(address(governance) != address(0), "Governance not deployed");
        require(address(governance.pool()) == address(liquidityPool), "Wrong pool in governance");
        require(address(governance.governanceToken()) == address(governanceToken), "Wrong governance token in governance");
        
        // Verify launchpad
        require(address(launchpad) != address(0), "Launchpad not deployed");
        require(address(launchpad.baseToken()) == address(baseToken), "Wrong base token in launchpad");
        require(address(launchpad.liquidityPool()) == address(liquidityPool), "Wrong liquidity pool in launchpad");
        
        // Verify magic link escrow
        require(address(magicLinkEscrow) != address(0), "Magic link escrow not deployed");
        
        console.log("All contracts verified successfully");
    }
    
    function _printDeploymentSummary() internal view {
        console.log("\nCONTRACT ADDRESSES:");
        console.log("==================");
        console.log("Base Token (TestTokens):", address(baseToken));
        console.log("Governance Token (AGOV):", address(governanceToken));
        console.log("LP Token (ALP):", address(lpToken));
        console.log("Liquidity Pool:", address(liquidityPool));
        console.log("Governance:", address(governance));
        console.log("Launchpad:", address(launchpad));
        console.log("Magic Link Escrow:", address(magicLinkEscrow));
        
        console.log("\nCONTRACT RELATIONSHIPS:");
        console.log("======================");
        console.log("Governance -> LiquidityPool:", address(governance.pool()));
        console.log("Governance -> GovernanceToken:", address(governance.governanceToken()));
        console.log("LiquidityPool -> Governance:", address(liquidityPool.governance()));
        console.log("LiquidityPool -> TokenA (Base):", address(liquidityPool.tokenA()));
        console.log("LiquidityPool -> TokenB (Governance):", address(liquidityPool.tokenB()));
        console.log("Launchpad -> BaseToken:", address(launchpad.baseToken()));
        console.log("Launchpad -> LiquidityPool:", address(launchpad.liquidityPool()));
        
        console.log("\nINITIAL STATE:");
        console.log("==============");
        console.log("Governance Token Total Supply:", governanceToken.totalSupply() / 1e18, "AGOV");
        console.log("Deployer Governance Token Balance:", governanceToken.balanceOf(deployer) / 1e18, "AGOV");
        console.log("Deployer Voting Power:", governanceToken.getVotes(deployer) / 1e18, "AGOV");
        console.log("Liquidity Pool Fee:", liquidityPool.fee(), "bps");
        console.log("Governance Voting Period:", governance.VOTING_PERIOD() / 86400, "days");
        console.log("Launchpad Launch Fee:", launchpad.LAUNCH_FEE(), "bps");
        
        console.log("\nNEXT STEPS:");
        console.log("===========");
        console.log("1. Save these contract addresses for frontend integration");
        console.log("2. Verify contracts on Avalanche Fuji Testnet explorer");
        console.log("3. Test contract functionality");
        console.log("4. Deploy frontend application");
        
        console.log("============================================================");
    }
    
    // Helper function to get contract addresses for frontend integration
    function getContractAddresses() external view returns (
        address _baseToken,
        address _governanceToken,
        address _lpToken,
        address _liquidityPool,
        address _governance,
        address _launchpad,
        address _magicLinkEscrow
    ) {
        return (
            address(baseToken),
            address(governanceToken),
            address(lpToken),
            address(liquidityPool),
            address(governance),
            address(launchpad),
            address(magicLinkEscrow)
        );
    }
}
