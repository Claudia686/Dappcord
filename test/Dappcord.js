const {
  expect
} = require("chai")

const tokens = (n) => {
  return ethers.utils.parseUnits(n.toString(), 'ether')
}

describe("Dappcord", function() {
  let dappcord
  let deployer, user, owner, user1, account, hacker, buyer

  const NAME = "Dappcord"
  const SYMBOL = "DC"

  beforeEach(async () => {
    [deployer, user, owner, user1, account, hacker, buyer] = await ethers.getSigners()

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

  describe("Sets user Profile", () => {
    describe("Success", async () => {
      it("Set and retrieve user profiles", async () => {
        const name = "Alice";
        const bio = "Crypto enthusiast";
        const avatarUrl = "https://example.com/avatar.png";

        await dappcord.connect(user1).setUserProfile(name, bio, avatarUrl);

        const userProfile = await dappcord.getUserProfile(user1.address);
        expect(userProfile.name).to.equal("Alice");
        expect(userProfile.bio).to.equal("Crypto enthusiast");
        expect(userProfile.avatarUrl).to.equal("https://example.com/avatar.png");
      })

      it("Allow users to update their profiles", async () => {
        const name = "Alice";
        const updatedName = "Alice Updated";
        const bio = "Crypto enthusiast";
        const updatedBio = "Newbio";
        const avatarUrl = "https://example.com/avatar.png";
        const updatedAvatarUrl = "https://example.com/avatar-updated.png";

        await dappcord.connect(user1).setUserProfile(name, bio, avatarUrl);
        await dappcord.connect(user1).setUserProfile(updatedName, updatedBio, updatedAvatarUrl);

        const userProfile = await dappcord.getUserProfile(user1.address)
        expect(userProfile.name).to.equal(updatedName);
        expect(userProfile.bio).to.equal(updatedBio);
        expect(userProfile.avatarUrl).to.equal(updatedAvatarUrl);
      })
    })

    describe("Failure", async () => {
      it("Rejects setting a user profile with an empty name", async () => {
        const emptyName = "";
        const bio = "Bio";
        const avatarUrl = "ValidUrl";

        const transaction = dappcord.connect(user1).setUserProfile(emptyName, bio, avatarUrl);
        await expect(transaction).to.be.reverted
      })
    })
  })

  describe("Joining Channels", async () => {
    describe("Success", async () => {
      const ID = 1
      const AMOUNT = ethers.utils.parseUnits("1", "ether")

      beforeEach(async () => {
        const transaction = await dappcord.connect(user).mint(ID, {
          value: AMOUNT
        })
        await transaction.wait()
      })

      it("Joins the user", async () => {
        const result = await dappcord.hasJoined(ID, user.address)
        expect(result).to.equal(true)
      })

      it("Increases total supply", async () => {
        const result = await dappcord.totalSupply()
        expect(result).to.equal(ID)
      })

      it("Updates contract balance", async () => {
        const result = await ethers.provider.getBalance(dappcord.address)
        expect(result).to.equal(AMOUNT)
      })
    })

    describe("Failure", async () => {
      it("Rejects if id is 0", async () => {
        const invalidId = 0
        const AMOUNT = ethers.utils.parseUnits("1", "ether")

        await expect(dappcord.connect(buyer).mint(invalidId, {
          value: AMOUNT
        })).to.be.reverted
      })

       it("Reverts minting with ID beyond total channels", async () => {
        const invalidChannelId = (await dappcord.totalChannels()) + 1
        await expect(dappcord.mint(invalidChannelId, {value: ethers.utils.parseEther("1")})).to.be.reverted
    
        })

      it("Rejects if user has already joined", async () => {
        const Id = 1;
        const AMOUNT = ethers.utils.parseUnits("1", "ether")

        await dappcord.connect(user1).mint(Id, {
          value: AMOUNT
        })

        const transaction = dappcord.connect(user1).mint(Id, {
          value: AMOUNT
        })

        await expect(transaction).to.be.reverted;
      })

      it("Rejects insufficient amount", async () => {
        await expect(dappcord.connect(buyer).mint(1, {
          value: ethers.utils.parseUnits('0.5', 'ether')
        })).to.be.reverted
      })
    })
  })

  describe("Withdrawing", () => {
    describe("Success", async () => {
      const ID = 1
      const AMOUNT = ethers.utils.parseUnits("10", 'ether')
      let balanceBefore

      beforeEach(async () => {
        balanceBefore = await ethers.provider.getBalance(deployer.address)

        let transaction = await dappcord.connect(user).mint(ID, {
          value: AMOUNT
        })
        await transaction.wait()

        transaction = await dappcord.connect(deployer).withdraw()
        await transaction.wait()
      })

      it('Updates the owner balance', async () => {
        const balanceAfter = await ethers.provider.getBalance(deployer.address)
        expect(balanceAfter).to.be.greaterThan(balanceBefore)
      })

      it('Updates the contract balance', async () => {
        const result = await ethers.provider.getBalance(dappcord.address)
        expect(result).to.equal(0)
      })
    })
    describe("Failure", async () => {
      it('Rejects non-owner from withdrawing', async () => {
        await expect(dappcord.connect(hacker).withdraw()).to.be.reverted
      })
    })
  })
})