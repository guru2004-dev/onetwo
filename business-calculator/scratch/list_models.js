async function listFreeModels() {
  try {
    const response = await fetch("https://openrouter.ai/api/v1/models");
    const data = await response.json();
    const freeModels = data.data
      .filter(m => m.id.endsWith(':free'))
      .map(m => m.id);
    console.log(JSON.stringify(freeModels, null, 2));
  } catch (error) {
    console.error('Error:', error);
  }
}

listFreeModels();
