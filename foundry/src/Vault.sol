// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Vault is Ownable {

    event Withdrawn(address indexed to, uint256 amount);
    event TokenWithdrawn(address indexed token, address indexed to, uint256 amount);

    constructor() Ownable(msg.sender) {}

    receive() external payable {}

    function withdraw(address to, uint256 amount) external onlyOwner {
        (bool success, ) = to.call{value: amount}("");
        require(success, "MON transfer failed");
        emit Withdrawn(to, amount);
    }

    function withdrawToken(address token, address to, uint256 amount) external onlyOwner {
        IERC20(token).transfer(to, amount);
        emit TokenWithdrawn(token, to, amount);
    }

    function balance() external view returns (uint256) {
        return address(this).balance;
    }

    function balanceOf(address token) external view returns (uint256) {
        return IERC20(token).balanceOf(address(this));
    }
}
