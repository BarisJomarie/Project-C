//------------------------------------------------------------NLP ANALYZER-------------------------------------------------------------------------------------------------
exports.analyzeText = async (req, res) => {
  try {
    const { text } = req.body;

    const mlUrl = `http://${process.env.ML_API_URL}:${process.env.ML_PORT}/predict-sdg`;

    const runBert = async (inputText) => {
      const response = await fetch(mlUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: inputText })
      });

      if (!response.ok) {
        throw new Error("ML Service Error: " + response.status);
      }

      return await response.json();
    };


    const result = await runBert(text);
    console.log("Python BERT result:", result);

    res.json({
      success: true,
      sdg_index: result.sdg_index,
      prediction: result.prediction,
      probabilities: result.probabilities,
      confidence: result.confidence,
    });
  }catch (error) {
    console.error("Error in /analyze-text:", error);
    res.status(500).json({ error: error.toString() });
  }
}