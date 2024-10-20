describe("Email Notification Tests", () => {
  it("should send email alerts for threshold breaches", async () => {
    const mockMailer = sinon.spy(transporter, "sendMail");
    await processThresholdBreach(
      "test_key",
      mockWeatherData,
      mockThreshold,
      "high"
    );
    expect(mockMailer.calledOnce).to.be.true;
  });
});
