//SPDX-License-Identifier: MIT
pragma solidity ^0.8.29;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {LiquidityPool} from "./LiquidityPool.sol";
import {LPToken} from "./LPToken.sol";

// Simple ERC20 token that can be created by the Launchpad
contract LaunchToken is ERC20, Ownable {
    constructor(
        string memory name,
        string memory symbol,
        uint256 totalSupply,
        address owner
    ) ERC20(name, symbol) Ownable(owner) {
        _mint(owner, totalSupply);
    }
    
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
    
    function burn(uint256 amount) external {
        _burn(msg.sender, amount);
    }
}
contract Launchpad is Ownable, ReentrancyGuard {
    using SafeERC20 for ERC20;

    struct Launch {
        address token;
        address creator;
        string name;
        string symbol;
        uint256 totalSupply;
        uint256 pricePerToken;
        uint256 minContribution;
        uint256 maxContribution;
        uint256 startTime;
        uint256 endTime;
        uint256 raisedAmount;
        bool launched;
        bool cancelled;
        address liquidityPool;
    }

    uint256 public launchCount;
    mapping(uint256 => Launch) public launches;
    mapping(address => mapping(uint256 => uint256)) public contributions;
    
    ERC20 public immutable baseToken;
    LiquidityPool public immutable liquidityPool;
    uint256 public constant LAUNCH_FEE = 1000;
    uint256 public constant FEE_DENOMINATOR = 10000;

    event LaunchCreated(uint256 indexed launchId, address indexed creator, address indexed token, string name, string symbol);
    event ContributionMade(uint256 indexed launchId, address indexed contributor, uint256 amount);
    event LaunchSuccessful(uint256 indexed launchId, uint256 raisedAmount);
    event LaunchCancelled(uint256 indexed launchId);

    constructor(ERC20 _baseToken, LiquidityPool _liquidityPool) Ownable(msg.sender) {
        baseToken = _baseToken;
        liquidityPool = _liquidityPool;
    }

    // Main function: Create token and launch in one transaction (pump.fun style)
    function createTokenAndLaunch(
        string memory name,
        string memory symbol,
        uint256 totalSupply,
        uint256 pricePerToken,
        uint256 minContribution,
        uint256 maxContribution,
        uint256 duration
    ) external payable nonReentrant {
        require(bytes(name).length > 0, "name required");
        require(bytes(symbol).length > 0, "symbol required");
        require(totalSupply > 0, "invalid supply");
        require(pricePerToken > 0, "invalid price");
        require(minContribution > 0, "invalid min");
        require(maxContribution >= minContribution, "invalid max");
        require(duration > 0, "invalid duration");
        
        uint256 launchFee = (totalSupply * pricePerToken * LAUNCH_FEE) / FEE_DENOMINATOR;
        require(msg.value >= launchFee, "insufficient fee");
        
        // Create new token with custom name and symbol
        LaunchToken newToken = new LaunchToken(name, symbol, totalSupply, address(this));
        
        launchCount++;
        launches[launchCount] = Launch({
            token: address(newToken),
            creator: msg.sender,
            name: name,
            symbol: symbol,
            totalSupply: totalSupply,
            pricePerToken: pricePerToken,
            minContribution: minContribution,
            maxContribution: maxContribution,
            startTime: block.timestamp,
            endTime: block.timestamp + duration,
            raisedAmount: 0,
            launched: false,
            cancelled: false,
            liquidityPool: address(0)
        });

        emit LaunchCreated(launchCount, msg.sender, address(newToken), name, symbol);
    }

    // Legacy function for existing tokens (keep for backward compatibility)
    function createLaunch(
        address token,
        uint256 totalSupply,
        uint256 pricePerToken,
        uint256 minContribution,
        uint256 maxContribution,
        uint256 duration
    ) external payable nonReentrant {
        require(token != address(0), "invalid token");
        require(totalSupply > 0, "invalid supply");
        require(pricePerToken > 0, "invalid price");
        require(minContribution > 0, "invalid min");
        require(maxContribution >= minContribution, "invalid max");
        require(duration > 0, "invalid duration");
        
        uint256 launchFee = (totalSupply * pricePerToken * LAUNCH_FEE) / FEE_DENOMINATOR;
        require(msg.value >= launchFee, "insufficient fee");
        
        // Get token name and symbol for existing token
        string memory tokenName = ERC20(token).name();
        string memory tokenSymbol = ERC20(token).symbol();
        
        launchCount++;
        launches[launchCount] = Launch({
            token: token,
            creator: msg.sender,
            name: tokenName,
            symbol: tokenSymbol,
            totalSupply: totalSupply,
            pricePerToken: pricePerToken,
            minContribution: minContribution,
            maxContribution: maxContribution,
            startTime: block.timestamp,
            endTime: block.timestamp + duration,
            raisedAmount: 0,
            launched: false,
            cancelled: false,
            liquidityPool: address(0)
        });

        emit LaunchCreated(launchCount, msg.sender, token, tokenName, tokenSymbol);
    }

    function contribute(uint256 launchId, uint256 amount) external nonReentrant {
        Launch storage launch = launches[launchId];
        require(launch.token != address(0), "launch not found");
        require(!launch.launched, "already launched");
        require(!launch.cancelled, "launch cancelled");
        require(block.timestamp >= launch.startTime, "not started");
        require(block.timestamp <= launch.endTime, "ended");
        require(amount >= launch.minContribution, "below minimum");
        require(amount <= launch.maxContribution, "above maximum");
        require(launch.raisedAmount + amount <= launch.totalSupply * launch.pricePerToken, "exceeds target");
        
        uint256 tokensToReceive = amount / launch.pricePerToken;
        require(tokensToReceive > 0, "no tokens");
        
        baseToken.safeTransferFrom(msg.sender, address(this), amount);
        contributions[msg.sender][launchId] += amount;
        launch.raisedAmount += amount;
        
        // Transfer tokens to contributor (they can claim them)
        ERC20(launch.token).safeTransfer(msg.sender, tokensToReceive);
        
        emit ContributionMade(launchId, msg.sender, amount);
    }

    function finalizeLaunch(uint256 launchId) external nonReentrant {
        Launch storage launch = launches[launchId];
        require(launch.creator == msg.sender, "not creator");
        require(!launch.launched, "already launched");
        require(!launch.cancelled, "launch cancelled");
        require(block.timestamp > launch.endTime, "not ended");
        require(launch.raisedAmount > 0, "no contributions");
        
        launch.launched = true;
        
        // Create new liquidity pool for this token
        LPToken newLPToken = new LPToken(address(this));
        LiquidityPool newPool = new LiquidityPool(baseToken, ERC20(launch.token), newLPToken);
        
        // Transfer ownership of LP Token to the new LiquidityPool
        newLPToken.transferOwnership(address(newPool));
        launch.liquidityPool = address(newPool);
        
        // Calculate amounts for liquidity provision (50% of raised funds)
        uint256 liquidityAmount = launch.raisedAmount / 2;
        
        // Calculate token amount based on price (same ratio as contributions)
        // For 50 ether raised at 100 price per token, we need 0.5 tokens
        uint256 tokenAmount = liquidityAmount / launch.pricePerToken;
        
        // Add initial liquidity to the pool (tokens will be transferred by the pool)
        ERC20(launch.token).approve(address(newPool), tokenAmount);
        baseToken.approve(address(newPool), liquidityAmount);
        newPool.addLiquidity(liquidityAmount, tokenAmount);
        
        // Transfer remaining funds to creator
        baseToken.safeTransfer(launch.creator, launch.raisedAmount - liquidityAmount);
        
        emit LaunchSuccessful(launchId, launch.raisedAmount);
    }

    function cancelLaunch(uint256 launchId) external nonReentrant {
        Launch storage launch = launches[launchId];
        require(launch.creator == msg.sender || msg.sender == owner(), "not authorized");
        require(!launch.launched, "already launched");
        require(!launch.cancelled, "already cancelled");
        
        launch.cancelled = true;
        
        uint256 refundAmount = launch.raisedAmount;
        if (refundAmount > 0) {
            baseToken.safeTransfer(launch.creator, refundAmount);
        }
        
        emit LaunchCancelled(launchId);
    }

    function withdrawFees() external onlyOwner {
        uint256 balance = baseToken.balanceOf(address(this));
        if (balance > 0) {
            baseToken.safeTransfer(owner(), balance);
        }
    }

    function isLaunchLaunched(uint256 launchId) external view returns (bool) {
        return launches[launchId].launched;
    }

    function isLaunchCancelled(uint256 launchId) external view returns (bool) {
        return launches[launchId].cancelled;
    }

    function getLaunchToken(uint256 launchId) external view returns (address) {
        return launches[launchId].token;
    }

    function getLaunchCreator(uint256 launchId) external view returns (address) {
        return launches[launchId].creator;
    }

    function getLaunchTokenInfo(uint256 launchId) external view returns (string memory name, string memory symbol) {
        Launch storage launch = launches[launchId];
        return (launch.name, launch.symbol);
    }

    function getLaunchDetails(uint256 launchId) external view returns (
        address token,
        address creator,
        string memory name,
        string memory symbol,
        uint256 totalSupply,
        uint256 pricePerToken,
        uint256 raisedAmount,
        bool launched,
        bool cancelled
    ) {
        Launch storage launch = launches[launchId];
        return (
            launch.token,
            launch.creator,
            launch.name,
            launch.symbol,
            launch.totalSupply,
            launch.pricePerToken,
            launch.raisedAmount,
            launch.launched,
            launch.cancelled
        );
    }

    // Simplified liquidity management - removed complex unlock functions to reduce size
}