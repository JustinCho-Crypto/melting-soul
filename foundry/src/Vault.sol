// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Vault is Ownable {
    IERC20 public paymentToken;

    event Withdrawn(address indexed token, address indexed to, uint256 amount);

    constructor(address _paymentToken) Ownable(msg.sender) {
        paymentToken = IERC20(_paymentToken);
    }

    /// @notice Withdraw default payment token (MON)
    function withdraw(address to, uint256 amount) external onlyOwner {
        paymentToken.transfer(to, amount);
        emit Withdrawn(address(paymentToken), to, amount);
    }

    /// @notice Withdraw any ERC20 token (AUSD, MST, etc.)
    function withdrawToken(address token, address to, uint256 amount) external onlyOwner {
        IERC20(token).transfer(to, amount);
        emit Withdrawn(token, to, amount);
    }

    /// @notice Get balance of default payment token
    function balance() external view returns (uint256) {
        return paymentToken.balanceOf(address(this));
    }

    /// @notice Get balance of any ERC20 token
    function balanceOf(address token) external view returns (uint256) {
        return IERC20(token).balanceOf(address(this));
    }
}
