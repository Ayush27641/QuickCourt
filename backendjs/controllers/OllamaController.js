const express = require('express');

/**
 * Java equivalent: OllamaController
 *
 * Java annotations:
 * - @CrossOrigin("*")
 * - @GetMapping("/getResponse")
 */
function OllamaController(ollamaService) {
  const router = express.Router();

  async function getResponse(req, res, next) {
    try {
      const prompt = req.body;
      const result = await ollamaService.getAnswer(prompt);
      return res.status(200).json(result);
    } catch (err) {
      return next(err);
    }
  }

  // Mirrors the Spring annotation exactly
  router.get('/getResponse', getResponse);

  return router;
}

module.exports = OllamaController;
