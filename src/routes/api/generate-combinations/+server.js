import { json } from '@sveltejs/kit';
import dotenv from 'dotenv';

dotenv.config();

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const YOUR_SITE_URL = process.env.YOUR_SITE_URL;
const YOUR_SITE_NAME = process.env.YOUR_SITE_NAME;

const extendedModelNames = [
    "meta-llama/llama-3.1-405b",
    "perplexity/llama-3.1-sonar-large-128k-online",
    "perplexity/llama-3.1-sonar-small-128k-online",
    "aetherwiing/mn-starcannon-12b",
    "nvidia/nemotron-4-340b-instruct",
    "liuhaotian/llava-yi-34b",
    "01-ai/yi-34b-200k",
    "neversleep/noromaid-mixtral-8x7b-instruct",
    "gryphe/mythomax-l2-13b",
    "austism/chronos-hermes-13b",
    "togethercomputer/stripedhyena-hessian-7b"
];
const modelNames = [
    "openai/gpt-3.5-turbo",
    "anthropic/claude-2",
    "google/palm-2-chat-bison",
    "meta-llama/llama-2-70b-chat",
    "meta-llama/llama-2-13b-chat",
    "mistralai/mistral-7b-instruct"
];

// let selectedModel = "openai/gpt-3.5-turbo";

async function generateCompletion(prompt, modelName) {
    let selectedModel = modelNames[Math.floor(Math.random() * modelNames.length)];
    console.log(`🚀 ~ generateCompletion ~ selectedModel:`, selectedModel)
    try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
                "HTTP-Referer": YOUR_SITE_URL,
                "X-Title": YOUR_SITE_NAME,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                "model": `${selectedModel}`,
                "messages": [
                    { "role": "system", "content": "You are a creative assistant that combines items in semantically logical ways to produce noun combinations." },
                    { "role": "user", "content": prompt }
                ],
                "max_tokens": 30,
                "temperature": 0.8
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
        }

        const data = await response.json();
        return data.choices[0].message.content.trim();
    } catch (error) {
        console.error('Error in generateCompletion:', error);
        throw error;
    }
}

export async function POST({ request }) {
    try {
        const { element1, element2 } = await request.json();

        const prompt = `Combine "${element1}" and "${element2}" into a single, concise noun.

        STRICT RULES:
        1. Respond with ONLY 1 to 3 words. No exceptions.
        2. Prefer single-word or two-word responses.
        3. Use Title Case (capitalize first letter of each word).
        4. Do not use any punctuation.
        5. The result must be a noun.
        6. Ensure a logical connection to both original elements.
        
        Your entire response should be just the new noun combination, nothing else.
        
        Examples of good responses:
        - Water + Fire: Steam
        - Earth + Wind: Dust
        - Time + Sand: Hourglass
        - Fire + Tree: Ash
        - Ocean + Mountain: Seamount
        
        REMEMBER: 1 to 3 words ONLY. No explanations. No additional text.`;
        let results = [];
        for (let i = 0; i < 5; i++) {
            const selectedModel = modelNames[Math.floor(Math.random() * modelNames.length)];
            const result = await generateCompletion(prompt, selectedModel);
            results.push({ model: selectedModel, combination: result });
        }
        console.log(`🚀 ~ POST ~ results:`, results)

        let finalResults = json({ combinations: results });
        console.log(`🚀  POST ~ finalResults:`, finalResults)
        return finalResults;
    } catch (error) {
        console.error('Error in POST handler:', error);
        return json({ error: 'Failed to generate combinations', details: error.message }, { status: 500 });
    }
}