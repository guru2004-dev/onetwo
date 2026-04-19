
async function test() {
  const apiKey = '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';
  const baseURL = 'https://openrouter.ai/api/v1';
  const model = 'meta-llama/llama-3.2-3b-instruct:free';

  try {
    const response = await fetch(`${baseURL}/chat/completions`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: "user", content: "Hi" }
        ],
      })
    });

    const data = await response.json();
    console.log('Status:', response.status);
    console.log('Data:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error:', error);
  }
}

test();
