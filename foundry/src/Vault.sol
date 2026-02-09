// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Vault is Ownable {
    IERC20 public paymentToken;

    event Withdrawn(address indexed to, uint256 amount);

    constructor(address _paymentToken) Ownable(msg.sender) {
        paymentToken = IERC20(_paymentToken);
    }

    function withdraw(address to, uint256 amount) external onlyOwner {
        paymentToken.transfer(to, amount);
        emit Withdrawn(to, amount);
    }

    function balance() external view returns (uint256) {
        return paymentToken.balanceOf(address(this));
    }
}
