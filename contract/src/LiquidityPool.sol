//SPDX-License-Identifier: MIT
pragma solidity ^0.8.29;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {LPToken} from "./LPToken.sol";

contract LiquidityPool is Ownable, ReentrancyGuard {
    using SafeERC20 for ERC20;

    uint256 public reserveA;
    uint256 public reserveB;
    uint public fee = 30;
    uint constant FEE_DENOMINATOR = 10000;
    uint public totalSupply;

    event LiquidityAdded(address provider, uint amountA, uint amountB, uint lpTokens);
    event Swap(address trader, address tokenIn, uint amountIn, address tokenOut, uint amountOut);
    event FeeUpdated(uint newFee);
    event LiquidityRemoved(address provider, uint amountA, uint amountB, uint lpTokens);

    ERC20 public tokenA;
    ERC20 public tokenB;
    LPToken public lpToken;
    address public governance;
    
    modifier onlyGovernance() {
        require(msg.sender == governance, "Only governance");
        _;
    }
    
    function setGovernance(address _governance) external onlyOwner {
        governance = _governance;
    }

    constructor(ERC20 _tokenA, ERC20 _tokenB, LPToken _lpToken) Ownable(msg.sender) {
        tokenA = _tokenA;
        tokenB = _tokenB;
        lpToken = _lpToken;
    }

    function addLiquidity(uint amountA, uint amountB) external nonReentrant {
        require(amountA > 0 && amountB > 0, "invalid");
        
        uint lpAmount;
        if (totalSupply == 0) {
            lpAmount = amountA;
        } else {
            uint lpAmountA = (amountA * totalSupply) / reserveA;
            uint lpAmountB = (amountB * totalSupply) / reserveB;
            lpAmount = lpAmountA < lpAmountB ? lpAmountA : lpAmountB;
        }
        
        require(lpAmount > 0, "invalid");
        
        tokenA.safeTransferFrom(msg.sender, address(this), amountA);
        tokenB.safeTransferFrom(msg.sender, address(this), amountB);
        
        reserveA += amountA;
        reserveB += amountB;
        totalSupply += lpAmount;
        
        lpToken.mint(msg.sender, lpAmount);
        
        emit LiquidityAdded(msg.sender, amountA, amountB, lpAmount);
    }

    function removeLiquidity(uint lpAmount) external nonReentrant {
        require(lpAmount > 0, "invalid");
        require(lpToken.balanceOf(msg.sender) >= lpAmount, "insufficient LP tokens");
        
        uint amountA = (lpAmount * reserveA) / totalSupply;
        uint amountB = (lpAmount * reserveB) / totalSupply;
        
        require(amountA > 0 && amountB > 0, "invalid");
        require(amountA <= reserveA && amountB <= reserveB, "invalid");
        
        reserveA -= amountA;
        reserveB -= amountB;
        totalSupply -= lpAmount;
        
        lpToken.burn(msg.sender, lpAmount);
        tokenA.safeTransfer(msg.sender, amountA);
        tokenB.safeTransfer(msg.sender, amountB);
        
        emit LiquidityRemoved(msg.sender, amountA, amountB, lpAmount);
    }

    function swapAtoB(uint amountA) external nonReentrant {
        require(amountA > 0, "invalid");
        require(reserveA > 0 && reserveB > 0, "invalid reserves");
        
        tokenA.safeTransferFrom(msg.sender, address(this), amountA);
        
        uint amountInWithFee = amountA * (FEE_DENOMINATOR - fee) / FEE_DENOMINATOR;
        uint amountOut = (reserveB * amountInWithFee) / (reserveA + amountInWithFee);
        
        require(amountOut > 0, "invalid output");
        require(amountOut < reserveB, "insufficient liquidity");
        
        tokenB.safeTransfer(msg.sender, amountOut);
        
        reserveA += amountA;
        reserveB -= amountOut;
        
        emit Swap(msg.sender, address(tokenA), amountA, address(tokenB), amountOut);
    }

    function swapBtoA(uint amountB) external nonReentrant {
        require(amountB > 0, "invalid");
        require(reserveA > 0 && reserveB > 0, "invalid reserves");
        
        tokenB.safeTransferFrom(msg.sender, address(this), amountB);
        
        uint amountInWithFee = amountB * (FEE_DENOMINATOR - fee) / FEE_DENOMINATOR;
        uint amountOut = (reserveA * amountInWithFee) / (reserveB + amountInWithFee);
        
        require(amountOut > 0, "invalid output");
        require(amountOut < reserveA, "insufficient liquidity");
        
        tokenA.safeTransfer(msg.sender, amountOut);
        
        reserveA -= amountOut;
        reserveB += amountB;
        
        emit Swap(msg.sender, address(tokenB), amountB, address(tokenA), amountOut);
    }

    function setNewFee(uint newFee) external onlyGovernance {
        require(newFee <= 1000, "invalid");
        fee = newFee;
        emit FeeUpdated(newFee);
    }

    function getReserves() external view returns (uint, uint) {
        return (reserveA, reserveB);
    }
}