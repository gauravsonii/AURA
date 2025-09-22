//SPDX-License-Identifier: MIT
pragma solidity ^0.8.29;

import "forge-std/Test.sol";
import {TestTokens} from "../src/TestTokens.sol";

contract TestTokensTest is Test {
    TestTokens token;
    address user = address(0xBEEF);

    function setUp() public {
        token = new TestTokens("TokenA","A");
    }

    function testMintOnlyOwner() public {
        token.mint(address(this), 100 ether);
        assertEq(token.balanceOf(address(this)), 100 ether);
        vm.prank(user);
        vm.expectRevert();
        token.mint(user, 1 ether);
    }

    function testBurn() public {
        token.mint(address(this), 50 ether);
        token.burn(20 ether);
        assertEq(token.balanceOf(address(this)), 30 ether);
    }
}


