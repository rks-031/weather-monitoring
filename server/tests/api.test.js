const autocannon = require("autocannon");
const { expect } = require("chai");

describe("API Load Tests", () => {
  it("should handle multiple concurrent requests", async () => {
    const result = await autocannon({
      url: "http://localhost:5000/api/weather/Delhi",
      connections: 10,
      duration: 10,
    });
    expect(result.errors).to.equal(0);
    expect(result.timeouts).to.equal(0);
  });
});
