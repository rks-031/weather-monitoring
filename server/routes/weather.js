router.get("/thresholds", async (req, res) => {
  try {
    const thresholds = await Threshold.find();
    res.json(thresholds);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete("/thresholds/:id", async (req, res) => {
  try {
    await Threshold.findByIdAndDelete(req.params.id);
    res.json({ message: "Threshold deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
