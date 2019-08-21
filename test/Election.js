const Election = artifacts.require("./Election.sol");

contract("Election", async (accounts) => {
  before(async () => {
    this.election = await Election.deployed()
  })

  it("initializes with two candidates", async () => {
      const candidateCount = await this.election.candidatesCount();
      assert.equal(candidateCount, 2);
  
  });

  it("it initializes the candidates with the correct values", async () => {
      const candidate1 = await this.election.candidates(1);
      assert.equal(candidate1[0], 1, "contains the correct id");
      assert.equal(candidate1[1], "Candidate 1", "contains the correct name");
      assert.equal(candidate1[2], 0, "contains the correct votes count");
      
      const candidate2 = await this.election.candidates(2);
      assert.equal(candidate2[0], 2, "contains the correct id");
      assert.equal(candidate2[1], "Candidate 2", "contains the correct name");
      assert.equal(candidate2[2], 0, "contains the correct votes count");
  });

  it("allows a voter to cast a vote", async () => {
      const candidateId = 1;
      const receipt = await this.election.vote(candidateId, { from: accounts[0] });
      assert.equal(receipt.logs.length, 1, "an event was triggered");
      assert.equal(receipt.logs[0].event, "votedEvent", "the event type is correct");
      assert.equal(receipt.logs[0].args._candidateId.toNumber(), candidateId, "the candidate id is correct");
      
      const voted = await this.election.voters(accounts[0]);
      assert(voted, "the voter was marked as voted");

      const candidate = await this.election.candidates(candidateId);
      const voteCount = candidate[2];
      assert.equal(voteCount, 1, "increments the candidate's vote count");
  });

  it("throws an exception for invalid candiate", async () => {
    try {
      await this.election.vote(99, { from: accounts[1] })
    } catch(error) {
      assert(error.message.indexOf('revert') >= 0, "error message must contain revert");
    } finally {
      const candidate1 = await this.election.candidates(1);
      let voteCount = candidate1[2].toNumber();
      assert.equal(voteCount, 1, "candidate 1 did not receive any votes");

      const candidate2 = await this.election.candidates(2);
      voteCount = candidate2[2];
      assert.equal(voteCount, 0, "candidate 2 did not receive any votes");
    }
  });

  it("throws an exception for double voting", async () => {
      const candidateId = 2;
      await this.election.vote(candidateId, { from: accounts[1] });
      
      const candidate = await this.election.candidates(candidateId);
      let voteCount = candidate[2];
      assert.equal(voteCount, 1, "accepts first vote");
      // Try to vote again
      try {
        await this.election.vote(candidateId, { from: accounts[1] });
      } catch (error) {
        assert(error.message.indexOf('revert') >= 0, "error message must contain revert");
      } finally {
        const candidate1 = await this.election.candidates(1);
        voteCount = candidate1[2];
        assert.equal(voteCount, 1, "candidate 1 did not receive any votes");

        const candidate2 = await this.election.candidates(2);
        voteCount = candidate2[2];
        assert.equal(voteCount, 1, "candidate 2 did not receive any votes");
      }
  });
});
