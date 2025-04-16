const { ethers, deployments, getNamedAccounts, network } = require("hardhat")
const { expect, assert } = require("chai")
const { developmentChains } = require("../../helper-hardhat-config")

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("FundMe", function () {
          let fundMe,
              deployer,
              mockV3Aggregator,
              sendValue = ethers.parseEther("100")

          beforeEach(async function () {
              deployer = (await getNamedAccounts()).deployer

              await deployments.fixture(["all"])

              signer = await ethers.getSigner(deployer)

              fundMe = await ethers.getContractAt(
                  "FundMe",
                  (
                      await deployments.get("FundMe")
                  ).address,
                  signer
              )
              mockV3Aggregator = await ethers.getContractAt(
                  "MockV3Aggregator",
                  (
                      await deployments.get("MockV3Aggregator")
                  ).address,
                  signer
              )

              // console.log(`FundMe: `, fundMe.provider)
              // console.log(`Ethers: `, ethers.provider)
          })
          describe("constructor", async function () {
              it("Sets the aggregator address correctly", async function () {
                  const response = await fundMe.getPriceFeed()
                  assert.equal(response, mockV3Aggregator.target)
              })
          })
          describe("fund", async function () {
              it("Fails if you don't send enough ETH", async function () {
                  await expect(fundMe.fund()).to.be.revertedWith(
                      "Not enough ether"
                  )
              })
              it("Updates the amount funded data structure", async function () {
                  await fundMe.fund({ value: sendValue })
                  const response = await fundMe.getAddressValue(deployer)
                  assert.equal(response.toString(), sendValue.toString())
              })
              it("Adds funder to array of funders", async function () {
                  await fundMe.fund({ value: sendValue })
                  const funder = await fundMe.getFundersList(0)
                  assert.equal(funder, deployer)
              })
          })
          describe("withdraw", async function () {
              beforeEach(async function () {
                  await fundMe.fund({ value: sendValue })
              })
              it("Withdraw ETH from a single founder", async function () {
                  // Arrange
                  const startingFundMeBalance =
                      await ethers.provider.getBalance(fundMe.target)
                  const startingDeployerBalance =
                      await ethers.provider.getBalance(deployer)
                  // Act
                  const transactionResponse = await fundMe.withdraw()
                  const transactionReceipt = await transactionResponse.wait(1)
                  const { gasUsed, gasPrice } = transactionReceipt
                  const gasCost = gasUsed * gasPrice

                  const endingFundMeBalance = await ethers.provider.getBalance(
                      fundMe.target
                  )
                  const endingDeployerBalance =
                      await ethers.provider.getBalance(deployer)

                  let startingAddedValue =
                      startingFundMeBalance + startingDeployerBalance
                  let endingAddedValue = endingDeployerBalance + gasCost
                  // Assert
                  assert.equal(endingFundMeBalance, 0)
                  assert.equal(
                      startingAddedValue.toString(),
                      endingAddedValue.toString()
                  )
              })
              it("Allows us to withdraw with multiple funders", async function () {
                  // Arrange
                  const accounts = await ethers.getSigners()
                  for (let i = 1; i < 6; i++) {
                      const fundMeConnectedContract = await fundMe.connect(
                          accounts[i]
                      )
                      await fundMeConnectedContract.fund({
                          value: sendValue,
                      })
                  }

                  const startingFundMeBalance =
                      await ethers.provider.getBalance(fundMe.target)
                  const startingDeployerBalance =
                      await ethers.provider.getBalance(deployer)
                  // Act
                  const transactionResponse = await fundMe.withdraw()
                  const transactionReceipt = await transactionResponse.wait(1)
                  const { gasUsed, gasPrice } = transactionReceipt
                  const gasCost = gasUsed * gasPrice

                  const endingFundMeBalance = await ethers.provider.getBalance(
                      fundMe.target
                  )
                  const endingDeployerBalance =
                      await ethers.provider.getBalance(deployer)

                  let startingAddedValue =
                      startingFundMeBalance + startingDeployerBalance
                  let endingAddedValue = endingDeployerBalance + gasCost
                  // Assert
                  assert.equal(endingFundMeBalance, 0)
                  assert.equal(
                      startingAddedValue.toString(),
                      endingAddedValue.toString()
                  )

                  await expect(fundMe.getFundersList(0)).to.be.reverted

                  for (let i = 1; i < 6; i++) {
                      assert.equal(
                          await fundMe.getAddressValue(accounts[i].address),
                          0
                      )
                  }
              })
              it("Only allows the owner to withdraw", async function () {
                  const accounts = await ethers.getSigners()
                  const attacker = accounts[1]
                  const attackerConnectedContract = await fundMe.connect(
                      attacker
                  )

                  await expect(
                      attackerConnectedContract.withdraw()
                  ).to.be.revertedWithCustomError(fundMe, "FundMe__NotOwner")
              })
              it("Cheaper withdraw test", async function () {
                  // Arrange
                  const accounts = await ethers.getSigners()
                  for (let i = 1; i < 6; i++) {
                      const fundMeConnectedContract = await fundMe.connect(
                          accounts[i]
                      )
                      await fundMeConnectedContract.fund({
                          value: sendValue,
                      })
                  }

                  const startingFundMeBalance =
                      await ethers.provider.getBalance(fundMe.target)
                  const startingDeployerBalance =
                      await ethers.provider.getBalance(deployer)
                  // Act
                  const transactionResponse = await fundMe.cheaperWithdraw()
                  const transactionReceipt = await transactionResponse.wait(1)
                  const { gasUsed, gasPrice } = transactionReceipt
                  const gasCost = gasUsed * gasPrice

                  const endingFundMeBalance = await ethers.provider.getBalance(
                      fundMe.target
                  )
                  const endingDeployerBalance =
                      await ethers.provider.getBalance(deployer)

                  let startingAddedValue =
                      startingFundMeBalance + startingDeployerBalance
                  let endingAddedValue = endingDeployerBalance + gasCost
                  // Assert
                  assert.equal(endingFundMeBalance, 0)
                  assert.equal(
                      startingAddedValue.toString(),
                      endingAddedValue.toString()
                  )

                  await expect(fundMe.getFundersList(0)).to.be.reverted

                  for (let i = 1; i < 6; i++) {
                      assert.equal(
                          await fundMe.getAddressValue(accounts[i].address),
                          0
                      )
                  }
              })
          })
          describe("getOwner", async function () {
              it("Fetches the address of the owner", async function () {
                  //
              })
          })
      })
