// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import "./PriceConverter.sol";
import {AggregatorV3Interface} from "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";
import "hardhat/console.sol";

error FundMe__NotOwner();

contract FundMe {
    using PriceConverter for uint256;

    mapping(address => uint256) private s_funders;
    address[] private s_fundersList;

    address private immutable i_owner;
    uint256 public constant MINIMUM_USD = 58 * 1e18;
    AggregatorV3Interface private s_priceFeed;

    modifier onlyOwner {
        // require(msg.sender == i_owner);
        if (msg.sender != i_owner) {
            revert FundMe__NotOwner();
        }
        _;
    }

    constructor(address priceFeedAddress) {
        i_owner = msg.sender;
        console.log("Price feed address: %s", priceFeedAddress);
        s_priceFeed = AggregatorV3Interface(priceFeedAddress);
    }

    function fund() public payable {
        require(msg.value.getConversionRate(s_priceFeed) >= MINIMUM_USD, "Not enough ether");
        console.log("Sending %s to the contract from %s",  msg.value, msg.sender);
        s_funders[msg.sender] += msg.value;
        s_fundersList.push(msg.sender);
    }

    function withdraw() public onlyOwner {
        for(uint256 i=0; i < s_fundersList.length; i++) {
            address funder = s_fundersList[i];
            s_funders[funder] = 0;
        }
        s_fundersList = new address[](0);

        (bool callSuccess, ) = payable(msg.sender).call{value: address(this).balance}("");
        require(callSuccess, "Call failed");
    }

    function cheaperWithdraw () public payable onlyOwner {
        address[] memory funders = s_fundersList;

        for(uint256 i=0; i < funders.length; i++) {
            address funder = funders[i];
            s_funders[funder] = 0;
        }
        s_fundersList = new address[](0);

        (bool callSuccess, ) = i_owner.call{value: address(this).balance}("");
        require(callSuccess, "Call failed");
    }

    function getOwner() public view returns(address) {
        return i_owner;
    }
    function getFundersList(uint256 index) public view returns(address) {
        return s_fundersList[index];
    }
    function getAddressValue(address funder) public view returns(uint256) {
        return s_funders[funder];
    }
    function getPriceFeed() public view returns(AggregatorV3Interface) {
        return s_priceFeed;
    }
}
