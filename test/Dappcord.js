const {
  expect
} = require("chai")

const tokens = (n) => {
  return ethers.utils.parseUnits(n.toString(), 'ether')
}

describe("Dappcord", function() {
  let dappcord
  let deployer, owner

  const NAME = "Dappcord"
  const SYMBOL = "DC"

  beforeEach(async () => {
    [deployer, user] = await ethers.getSigners()

    const Dappcord = await ethers.getContractFactory("Dappcord")
    dappcord = await Dappcord.deploy(NAME, SYMBOL)

    const transaction = await dappcord.connect(deployer).createChannel("general", tokens(1))
    await transaction.wait()
  })

  describe("Deployment", function() {
    it("Sets the name", async () => {
      let result = await dappcord.name()
      expect(result).to.equal(NAME)
    })

    it("Sets the name", async () => {
      result = await dappcord.symbol()
      expect(result).to.equal(SYMBOL)
    })

    it("Sets the owner", async () => {
      const result = await dappcord.owner()
      expect(result).to.equal(deployer.address)
    })
  })

  describe("Creating Channels", async () => {
    it("Returns total channels", async () => {
      const result = await dappcord.totalChannels()
      expect(result).to.equal(1)
    })

    it("Returns channel attributes", async () => {
      const channel = await dappcord.getChannel(1)
      expect(channel.id).to.equal(1) 
      expect(channel.name).to.equal("general") 
      expect(channel.cost).to.equal(tokens(1)) 
    })

  })
})