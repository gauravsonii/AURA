//SPDX-License-Identifier: MIT
pragma solidity ^0.8.29;

import "forge-std/Test.sol";
import {LiquidityPool} from "../src/LiquidityPool.sol";
import {TestTokens} from "../src/TestTokens.sol";
import {LPToken} from "../src/LPToken.sol";
contract LiquidityPoolTest is Test {
    LiquidityPool pool;
    TestTokens tokenA;
    TestTokens tokenB;
    address user = address(0xBEEF);

    function setUp() public {
        tokenA = new TestTokens("TokenA","A");
        tokenB = new TestTokens("TokenB","B");
        tokenA.mint(address(this), 1_000_000 ether);
        tokenB.mint(address(this), 1_000_000 ether);
        tokenA.mint(user, 1_000_000 ether);
        tokenB.mint(user, 1_000_000 ether);
        LPToken lpToken = new LPToken(address(this));
        pool = new LiquidityPool(tokenA, tokenB, lpToken);
        lpToken.transferOwnership(address(pool));
        tokenA.approve(address(pool), type(uint256).max);
        tokenB.approve(address(pool), type(uint256).max);
        vm.prank(user);
        tokenA.approve(address(pool), type(uint256).max);
        vm.prank(user);
        tokenB.approve(address(pool), type(uint256).max);
    }

    function testAddLiquidityUpdatesReserves() public {
        pool.addLiquidity(1_000 ether, 2_000 ether);
        (uint a, uint b) = pool.getReserves();
        assertEq(a, 1_000 ether);
        assertEq(b, 2_000 ether);
    }

    function testRemoveLiquidityTransfersTokens() public {
        pool.addLiquidity(1_000 ether, 1_000 ether);
        uint lpBalance = pool.lpToken().balanceOf(address(this));
        uint balABefore = tokenA.balanceOf(address(this));
        uint balBBefore = tokenB.balanceOf(address(this));
        
        pool.removeLiquidity(lpBalance / 2);
        
        assertGt(tokenA.balanceOf(address(this)), balABefore);
        assertGt(tokenB.balanceOf(address(this)), balBBefore);
        (uint a, uint b) = pool.getReserves();
        assertLt(a, 1_000 ether);
        assertLt(b, 1_000 ether);
    }

    function testSwapAtoBUpdatesReserves() public {
        pool.addLiquidity(10_000 ether, 10_000 ether);
        uint userBBefore = tokenB.balanceOf(user);
        vm.prank(user);
        pool.swapAtoB(1_000 ether);
        uint userBAfter = tokenB.balanceOf(user);
        assertGt(userBAfter, userBBefore);
        (uint a, uint b) = pool.getReserves();
        assertEq(a, 11_000 ether);
        assertLt(b, 10_000 ether);
    }

    function testSwapBtoAUpdatesReserves() public {
        pool.addLiquidity(10_000 ether, 10_000 ether);
        uint userABefore = tokenA.balanceOf(user);
        vm.prank(user);
        pool.swapBtoA(2_000 ether);
        uint userAAfter = tokenA.balanceOf(user);
        assertGt(userAAfter, userABefore);
        (uint a, uint b) = pool.getReserves();
        assertGt(b, 10_000 ether);
        assertLt(a, 10_000 ether + 2_000 ether);
    }

    function testSetNewFeeOnlyGovernance() public {
        vm.prank(user);
        vm.expectRevert(bytes("Only governance"));
        pool.setNewFee(50);
        pool.setGovernance(address(this));
        pool.setNewFee(50);
        assertEq(pool.fee(), 50);
    }

    function testSetNewFeeInvalidReverts() public {
        pool.setGovernance(address(this));
        vm.expectRevert(bytes("invalid"));
        pool.setNewFee(1001);
    }

    function testAddLiquidityInvalidReverts() public {
        vm.expectRevert(bytes("invalid"));
        pool.addLiquidity(0, 1);
        vm.expectRevert(bytes("invalid"));
        pool.addLiquidity(1, 0);
    }

    function testRemoveLiquidityInvalidReverts() public {
        vm.expectRevert(bytes("invalid"));
        pool.removeLiquidity(0);
    }

    function testSwapInvalidReverts() public {
        vm.expectRevert(bytes("invalid"));
        pool.swapAtoB(0);
        vm.expectRevert(bytes("invalid"));
        pool.swapBtoA(0);
    }

    function testLPTokenMinting() public {
        pool.addLiquidity(1_000 ether, 2_000 ether);
        uint lpBalance = pool.lpToken().balanceOf(address(this));
        assertEq(lpBalance, 1_000 ether);
        assertEq(pool.totalSupply(), 1_000 ether);
    }

    function testLPTokenProportionalWithdrawal() public {
        pool.addLiquidity(1_000 ether, 1_000 ether);
        uint lpBalance = pool.lpToken().balanceOf(address(this));
        
        pool.removeLiquidity(lpBalance);
        
        assertEq(pool.lpToken().balanceOf(address(this)), 0);
        (uint a, uint b) = pool.getReserves();
        assertEq(a, 0);
        assertEq(b, 0);
    }
}


