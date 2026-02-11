function OllamaService(chatClient) {
  async function getAnswer(message) {
    const chatResponse = await chatClient.prompt(message).call().chatResponse();

    let response =
      chatResponse?.getResult?.()?.getOutput?.()?.getText?.()
      ?? chatResponse?.result?.output?.text
      ?? chatResponse?.text;

    response = String(response ?? '');

    response = response.replace(/<think>[\s\S]*?<\/think>\s*/g, '');
    return response;
  }

  return {
    getAnswer,
  };
}

module.exports = OllamaService;
