const { ethers, deployments, getNamedAccounts, network } = require("hardhat")
const { expect, assert } = require("chai")
const { developmentChains } = require("../../helper-hardhat-config")

developmentChains.includes(network.name)
    ? describe.skip
    : describe("FundMe", function () {
          let fundMe,
              deployer,
              sendValue = ethers.parseEther("100")

          beforeEach(async function () {
              deployer = (await getNamedAccounts).deployer
              signer = await ethers.getSigner(deployer)

              fundMe = await ethers.getContractAt(
                  "FundMe",
                  (
                      await deployments.get("FundMe")
                  ).address,
                  signer
              )

              it("Allows people to fund and withdraw", async function () {
                  await fundMe.fund({ value: sendValue })
                  await fundMe.withdraw()
                  const endingBalance = await ethers.provider.getBalance(
                      fundMe.target
                  )

                  assert.equal(endingBalance.toString(), "0")
              })
          })
      })
