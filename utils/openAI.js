// Import the OpenAI library to interact with OpenAI's API
const OpenAI = require('openai');

require('dotenv').config();

// Initialize the OpenAI client with the API key
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || `YOUR-API-KEY`,
    // Use your API key securely from environment variables; avoid hardcoding it like this
});

// Function to generate a response based on the email category
async function generateResponse(category) {
    let prompt = '';  // Initialize the prompt variable

    // Set the prompt based on the email category
    if (category === 'Interested') {
        prompt = 'Generate a polite response asking the recipient to schedule a demo call.';
    } else if (category === 'More Information') {
        prompt = 'Generate a polite response providing more details about the product.';
    } else {
        prompt = 'Generate a polite response thanking the recipient for their time.';
    }

    // Send the prompt to the OpenAI API to generate a response
    const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo', // Specify the model for text generation
        messages: [{ role: 'user', content: prompt }], // Use the prompt as input
        max_tokens: 100, // Limit the response length
    });

    // Return the trimmed response from the AI
    return response.choices[0].message.content.trim();
}

// Export the generateResponse function to be used elsewhere in the project
module.exports = { generateResponse };
