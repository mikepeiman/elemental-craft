import { json } from '@sveltejs/kit';
import dotenv from 'dotenv';
import { addServerResponse, extendedModelNames } from '$lib/stores.js'

dotenv.config();

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const YOUR_SITE_URL = process.env.YOUR_SITE_URL;
const YOUR_SITE_NAME = process.env.YOUR_SITE_NAME;



const effectiveModelNames = [
    "mistralai/mistral-tiny",
    "perplexity/llama-3.1-sonar-small-128k-online",
    "microsoft/wizardlm-2-8x22b",
    "anthropic/claude-3-haiku",
    "openai/gpt-4o-mini-2024-07-18",
    "openai/gpt-3.5-turbo",
    "aetherwiing/mn-starcannon-12b",
    "meta-llama/llama-2-13b-chat",
]
const errorModels = [
    "liuhaotian/llava-yi-34b",
    "01-ai/yi-34b-200k",
    "nvidia/nemotron-4-340b-instruct",
    "neversleep/noromaid-mixtral-8x7b-instruct",
    "intel/neural-chat-7b",
]

const stupidModels = [
    "togethercomputer/stripedhyena-hessian-7b",
]

const finalModel = "anthropic/claude-3.5-sonnet";

const premiumModelNames = [
    "meta-llama/llama-3.1-405b",
    "openai/chatgpt-4o-latest",
    "anthropic/claude-2",
    "google/palm-2-chat-bison",

    "mistralai/mistral-7b-instruct"
];

const rules = `
        STRICT RULES:
        1. Respond with ONLY 1 to 3 words. No exceptions.
        2. Prefer single-word or two-word responses.
        3. Use Title Case (capitalize first letter of each word).
        4. Do not use any punctuation.
        5. The result must be a noun if a single word, but could include an adverb if two or three words
        6. Ensure a logical connection to both original elements.
        7. Avoid portmanteau and novelty coined phrases when possible (opt for things with existing references)`

const goodExamples = `
"Earth + Wind = Dust
Your response would be only: Dust"

"Fire + Water = Steam
Your response would be only: Steam"

"Earth + Water = Plant
Your response would be only: Plant"

"Wind + Wind = Tornado
Your response would be only: Tornado"

"Fire + Fire = Volcano
Your response would be only: Volcano"

"Lava + Mountain = Volcano
Your response would be only: Volcano"

"Lake + Volcano = Island
Your response would be only: Island"

"Island + Plant = Tree
Your response would be only: Tree"

"Steam + Wood = Train
Your response would be only: Train"

"Ocean + Sea = Fish
Your response would be only: Fish"

"Fish + Geyser = Whale
Your response would be only: Whale"

"Rainbow + Whale = Unicorn
Your response would be only: Unicorn"

"Mermaid + Unicorn = Narwhal
Your response would be only: Narwhal"

"Narwhal + Shark = Whalshark
Your response would be only: Whalshark"

"Rice + Volcano = Pizza
Your response would be only: Pizza"

"Pizza + Plant = Tomato
Your response would be only: Tomato"

"Lake + Plant = Lily
Your response would be only: Lily"

"Lily + Wind = Flower
Your response would be only: Flower"

"Flower + Tomato = Salad
Your response would be only: Salad"

"Mist + Moon = Fog
Your response would be only: Fog"

"Parthenon + Seahorse = Poseidon
Your response would be only: Poseidon"

"Snow Queen + Surfboard = Snowboard
Your response would be only: Snowboard"

"Froggy + Mushroom = Toad
Your response would be only: Toad"

"Chest + Robbery = Treasure
Your response would be only: Treasure"

"Hurricane + Steam Ship = Titanic
Your response would be only: Titanic"

"Dinosaur + Steam Tank = Stegosaurus
Your response would be only: Stegosaurus"

"Fishbowl + Goldberg = Aquarium
Your response would be only: Aquarium"

"Gold + Lake = Pirate
Your response would be only: Pirate"

"Rain + Rainbow = Rainbow
Your response would be only: Rainbow"

"Apollo + Werehorse = Centaur
Your response would be only: Centaur"

"Dragon + Werewolf = Werewolf
Your response would be only: Werewolf"

"King + Leviathan = Poseidon
Your response would be only: Poseidon"

"Crocodile + Phoenix = Dragon
Your response would be only: Dragon"

"Continent + Valentine = Australia
Your response would be only: Australia"

"Electricity + Restaurant = Frankenstein
Your response would be only: Frankenstein"

"Ice + Wave = Iceberg
Your response would be only: Iceberg"

"Mushroom + Sun = Smile
Your response would be only: Smile"

"Night + Paris = Eiffel Tower
Your response would be only: Eiffel Tower"

"Island + Shogi = Chess
Your response would be only: Chess"

"Olympus + Sasquatch = Zeus
Your response would be only: Zeus"

"Cook + Mud = Pig
Your response would be only: Pig"

"Fire + Potato = Chip
Your response would be only: Chip"

"Forest + Paradise = Eden
Your response would be only: Eden"

"Eden + Sashimi = Adam
Your response would be only: Adam"

"Adam + Smoke = Eve
Your response would be only: Eve"

"Eden + Tree = Apple
Your response would be only: Apple"

"Apple + Planet = Earth
Your response would be only: Earth"

"Olympus + Surfer = Poseidon
Your response would be only: Poseidon"

"Sashimi + Titan = Kraken
Your response would be only: Kraken"`

// let selectedModel = "openai/gpt-3.5-turbo";

const defaultParams = {
    // temperature: 0.0 to 2.0 (Default: 1.0) - Higher values increase randomness
    temperature: 0.7,

    // top_p: 0.0 to 1.0 (Default: 1.0) - Lower values increase focus on more likely tokens
    top_p: 0.9,

    // top_k: 0 or above (Default: 0) - Limits token choices, 0 means no limit
    // top_k: 50,

    // frequency_penalty: -2.0 to 2.0 (Default: 0.0) - Positive values reduce repetition
    frequency_penalty: 0.5,

    // presence_penalty: -2.0 to 2.0 (Default: 0.0) - Positive values reduce topic repetition
    presence_penalty: 0.5,

    // repetition_penalty: 0.0 to 2.0 (Default: 1.0) - Higher values reduce repetition
    // repetition_penalty: 1.2,

    // min_p: 0.0 to 1.0 (Default: 0.0) - Minimum probability for token consideration
    // min_p: 0.05,

    // top_a: 0.0 to 1.0 (Default: 0.0) - Dynamic token filtering based on highest probability
    // top_a: 0.2,

    // max_tokens: 1 or above - Maximum number of tokens to generate
    max_tokens: 10,

    // seed: any integer - For deterministic outputs
    // seed: 123456,

    // stop: array of strings - Stops generation when encountered
    // stop: ["\n", ".", ","],

    // logit_bias: object mapping token IDs to bias values (-100 to 100)
    // logit_bias: {"50256": -100},  // Example: reduce likelihood of <|endoftext|> token

    // logprobs: boolean - Whether to return token log probabilities
    // logprobs: true,

    // top_logprobs: 0 to 20 - Number of most likely tokens to return at each position
    // top_logprobs: 5,

    // response_format: object - Forces specific output format
    // response_format: { "type": "json_object" },

    // tools: array - For tool-calling functionality
    // tools: [{ "type": "function", "function": { "name": "get_current_weather", "parameters": { ... } } }],

    // tool_choice: string or object - Controls tool usage
    // tool_choice: "auto"  // or "none", "required", or { "type": "function", "function": { "name": "..." } }
};

async function generateCompletion(prompt, modelName, params = defaultParams) {

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
                "model": modelName,
                "messages": [
                    { "role": "user", "content": prompt }
                ],
                ...params
            })
        });

        if (!response.ok) {
            const errorText = await response.text();

            throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
        }

        const data = await response.json();
        console.log(`🚀 ~ generateCompletion ~ data:`, data); // Log the entire response


        if (!data || !data.choices || data.choices.length === 0 || !data.choices[0].message) {
            throw new Error('Unexpected API response structure');
        }

        let msg = data.choices[0].message.content.trim()
        console.log(`🚀 ~ generateCompletion ~ msg:`, msg)
        return msg
    } catch (error) {
        console.error('Error in generateCompletion:', error);
        return null; // Return null instead of throwing the error
    }
}


export async function POST({ request }) {
    try {
        const { element1, element2 } = await request.json();

        const prompt = `
        You are a creative assistant that combines items in semantically logical ways to produce a combination that is a noun (a thing).

        Combine "${element1}" and "${element2}" into a thing (a noun).
        Consider also the inverse combination "${element2}" and "${element1}".
               
        Your entire response should be just the new noun combination, nothing else.
        
        Good examples of combinations and results:
        ${goodExamples}

        Pick the result that is most semantically logical and sound.
        REMEMBER: 1 to 3 words ONLY. No explanations. No additional text.`;

        let results = [];
        for (let i = 0; i < extendedModelNames.length; i++) {
            const selectedModel = extendedModelNames[i];
            try {
                const result = await generateCompletion(prompt, selectedModel);
                if (result !== null) {
                    results.push({ model: selectedModel, combination: result, success: true, error: null });
                    console.log(`🚀 ~ POST ${selectedModel} ~ result:`, result);
                } else {
                    throw new Error('Null result returned from generateCompletion');
                }
            } catch (error) {
                results.push({ model: selectedModel, combination: null, success: false, error: error.message });
                console.error(`🚀 ~ POST ${selectedModel} ~ Failed to generate combination:`, error);
            }
        }

        // console.log(`🚀 ~ generateCombinations ~ results:`, results);

        let finalResults = results.map(r => `${r.combination}`).join('\n')
        // Final evaluation prompt
        console.log(`🚀 ~ POST ~ finalResults:`, finalResults)
        const evaluationPrompt = `Given the following combinations of "${element1}" and "${element2}", (consider also the inverse combination "${element2}" and "${element1}") select the best one based on creativity, relevance, and adherence to the rules:
    
        ${finalResults}
    
        Rules for selection:
        1. The chosen combination must be 1 to 3 words only.
        2. It should be in Title Case (capitalize first letter of each word).
        3. It must not contain any punctuation.
        4. It must be a noun.
        5. It should have a clear logical connection to both "${element1}" and "${element2}".
    
        Provide your response of 1-3 words in Capital Case with absolutely nothing else included.`;

        console.log(`🚀 ~ POST ~ evaluationPrompt:`, evaluationPrompt)


        const finalResult = await generateCompletion(evaluationPrompt, finalModel);

        const reasonPrompt = `Given the combination of "${element1}" + "${element2}" = "${finalResult}", explain the reasoning for why this is a good, sensible, semantic combination. Keep your explanation within 50-200 words. Issue your reasoning simply, without preamble. Use an enumerated list if appropriate. Use full sentences, but be concise.`

        const finalReason = await generateCompletion(reasonPrompt, finalModel, { max_tokens: 300 });
        console.log(`🚀 ~ POST ~ finalResult:`, finalResult)
        console.log(`🚀 ~ POST ~ finalReason:`, finalReason)


        let bestCombination = finalResult
        // Process the bestCombination to extract the final term or phrase
        if (bestCombination) {
            // Split on '=' or ':' and take the last part
            const parts = bestCombination.split(/[=:]/);
            bestCombination = parts[parts.length - 1].trim();

            // Remove any remaining punctuation and ensure proper capitalization
            bestCombination = bestCombination
                .replace(/[^\w\s-]/g, '')  // Remove any punctuation except hyphens
                .split(/\s+/)  // Split into words
                .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())  // Capitalize each word
                .join(' ');  // Join back into a string
        }

        // If no valid best combination is found, select the first valid combination from the results
        if (!bestCombination) {
            const validCombination = results.find(r => {
                const combination = r.combination.split(/[=:]/).pop().trim().replace(/[^\w\s-]/g, '');
                return combination && combination.split(' ').length <= 3;
            });
            bestCombination = validCombination
                ? validCombination.combination.split(/[=:]/).pop().trim().replace(/[^\w\s-]/g, '')
                : 'No valid combination found';

            // Ensure proper capitalization
            bestCombination = bestCombination
                .split(/\s+/)
                .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                .join(' ');

            reason = "Fallback selection due to no valid best combination found.";
        }

        // Create the new element object
        const newElement = {
            content: bestCombination,
            reason: finalReason,
            parents: [element1, element2]
        };

        console.log(`🚀 ~ New element created:`, newElement);


        // Return a proper Response object
        return json({
            allResults: results,
            combinations: results,
            bestCombination: bestCombination,
            newElement: newElement
        });
    } catch (error) {
        console.error('Error in POST handler:', error);
        // Return a proper Response object even in case of an error
        return json({ allResults: results, error: 'Failed to generate combinations', details: error.message }, { status: 500 });
    }
}