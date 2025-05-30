const { run } = require("hardhat")

async function verify(contractAddress, args) {
    console.log("Verifying contract...")
    try {
        await run("verify:verify", {
            address: contractAddress,
            constructorArguments: args,
        })
    } catch (error) {
        error.message.toLowerCase().includes("already verified")
            ? console.log("Already Verified")
            : console.log(error)
    }
}

module.exports = { verify }
