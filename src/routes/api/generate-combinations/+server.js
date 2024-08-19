import { json } from '@sveltejs/kit';
import dotenv from 'dotenv';
import { addApiResponse, addServerResponse } from '$lib/stores.js'
import { jsonrepair } from 'jsonrepair'

dotenv.config();

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const YOUR_SITE_URL = process.env.YOUR_SITE_URL;
const YOUR_SITE_NAME = process.env.YOUR_SITE_NAME;
const comparativeModel = "openai/chatgpt-4o-latest"

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
    repetition_penalty: 1.2,

    // min_p: 0.0 to 1.0 (Default: 0.0) - Minimum probability for token consideration
    min_p: 0.05,

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
    top_logprobs: 5,

    // response_format: object - Forces specific output format
    response_format: { "type": "json_object" },

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
        // console.log(`🚀 ~ generateCompletion for an individual model\n ${modelName}\n  ~ data:`, data); // Log the entire response
        addApiResponse(modelName, {
            type: 'success',
            response: data,
            timestamp: new Date().toISOString()
        })

        if (!data || !data.choices || data.choices.length === 0 || !data.choices[0].message) {
            throw new Error('Unexpected API response structure');
        }

        let msg = data.choices[0].message.content.trim()
        // console.log(`🚀 ~ generateCompletion  for an individual model ${modelName}  ~ msg:`, msg)
        return msg
    } catch (error) {
        console.error('Error in generateCompletion:', error);
        return null; // Return null instead of throwing the error
    }
}

let results = [];

const responseFormatJson = `
{
"mostLogical": {
  "result": "string",
  "explanation": "string"
},
"mostConcrete": {
  "result": "string",
  "explanation": "string"
},
"mostCreative": {
  "result": "string",
  "explanation": "string"
},
"mostRelevant": {
  "result": "string",
  "explanation": "string"
},
"mostDescriptive": {
  "result": "string",
  "explanation": "string"
},
`

function generateDescriptorsAndCombinations() {
    const descriptors = [
        'concrete',
        'logical',
        'relevant',
        'meaningful',
        'poetic',
        'creative',
        'popular culture',
        'traditional'
    ];

    const result = {};

    // Add individual descriptors
    descriptors.forEach(descriptor => {
        result[descriptor] = {
            result: "",
            explanation: ""
        };
    });

    // Generate combinations
    for (let i = 0; i < descriptors.length; i++) {
        for (let j = i + 1; j < descriptors.length; j++) {
            const combination = `${descriptors[i]} + ${descriptors[j]}`;
            result[combination] = {
                result: "",
                explanation: ""
            };
        }
    }

    return result;
}

// Generate and log the result
const descriptorsAndCombinations = generateDescriptorsAndCombinations();
console.log(JSON.stringify(descriptorsAndCombinations, null, 2));

const singleModelMultiPrompt = (element1, element2, responseFormatJson) => {

    return `You are a creative assistant that combines items in semantically logical ways to produce a combination that is a noun (a thing).
    Do your best to produce unexpected results that make intuitive sense to humans based on metaphoric, poetic, and cultural references.
    Always err on the side of real things and real references rather than portmanteaus and made-up words or phrases.
    We want the resulting item to be a real thing that itself possesses enough semantic depth to yield further meaningful combinations and results.

    Combine "${element1}" and "${element2}".
    
    You will provide answers guided by this list of descriptors, and their combinations:         
        'concrete',
        'logical',
        'relevant',
        'meaningful',
        'poetic',
        'creative',
        'popular culture',
        'traditional'.
        
    Respond in a strict format based on the guiding property: ${descriptorsAndCombinations} 
    Note the qualitative selections in the response object which each possess the same two properties.

    Each result should be only the 1-3 word new combination string in the "result": "string" property,
    and an explanation in the "explanation": "string" property 
 `
}

let responseIsJson = false
let isStructuredJson = true;
function extractJsonFromResponse(response) {
    // console.log(`🚀 ~ response:`, response);

    let parsedResponse = response;
    let responseIsJson = false;

    if (typeof response === 'object' && response !== null) {
        parsedResponse = response;
        responseIsJson = true;
        // isStructuredJson = true;
    } else if (typeof response === 'string') {
        const jsonStartIndex = response.indexOf('{');
        const jsonEndIndex = response.lastIndexOf('}');
        if (jsonStartIndex !== -1 && jsonEndIndex !== -1 && jsonEndIndex > jsonStartIndex) {
            let jsonSubstring = response.substring(jsonStartIndex, jsonEndIndex + 1);
            console.log(`🚀 ~ \n\nextractJsonFromResponse ~ jsonSubstring:\n\n`, jsonSubstring)
            let repairedResponse = jsonrepair(jsonSubstring);
            console.log(`🚀 ~ JSONREPAIRED extractJsonFromResponse ~ \n\n TYPEOF  ${typeof repairedResponse}:\n\n`, repairedResponse)

            try {
                // parsedResponse = JSON.parse(jsonSubstring);
                // console.log(`🚀 ~ extractJsonFromResponse ~ \n\nparsedResponse NONREPAIRED ATTEMPT TYPEOF ${parsedResponse} :\n\n`, parsedResponse)
                parsedResponse = JSON.parse(repairedResponse);
                console.log(`🚀 ~ extractJsonFromResponse ~ \n\n parsedResponse REPAIRED ATTEMPT TYPEOF ${typeof parsedResponse}:\n\n`, parsedResponse)
                responseIsJson = true;

                // isStructuredJson = Object.values(parsedResponse).every(value => {
                //     console.log(`🚀 ~ extractJsonFromResponse ~ value:`, value)
                //     return typeof value === 'object' && 'result' in value && 'explanation' in value
                // })
            } catch (error) {
                console.error('Error parsing JSON:', error);
                // If parsing fails, try to fix common issues
                jsonSubstring = jsonSubstring.replace(/,\s*}/g, '}').replace(/\n/g, '\\n'); // Remove trailing commas and escape newlines
                try {
                    parsedResponse = JSON.parse(jsonSubstring);
                    responseIsJson = true;

                    // isStructuredJson = Object.values(parsedResponse).every(value =>
                    //     typeof value === 'object' && 'result' in value && 'explanation' in value
                    // );
                } catch (error) {
                    console.error('Error parsing JSON after attempted fix:', error);
                    // If parsing fails again, leave parsedResponse as the original string
                }
            }
        } else {
            console.log('No valid JSON object found in the response string');
        }
    } else {
        console.log('Response is neither an object nor a string');
    }

    return { parsedResponse, responseIsJson, isStructuredJson };
}
let selectedModelApiResponse = {}
let jsonResponse
let finalComparativeResponse = {};
export async function POST({ request }) {
    try {
        const { element1, element2, modelName } = await request.json();

        let prompt = singleModelMultiPrompt(element1, element2, responseFormatJson)
        let selectedModelApiResponse;
        let jsonResponse;
        let results = [];

        try {
            selectedModelApiResponse = await generateCompletion(prompt, modelName, { max_tokens: 3000 });
            if (selectedModelApiResponse !== null) {
                results.push({ model: modelName, combination: selectedModelApiResponse, success: true, error: null });
                console.log(`🚀 ~\n\n POST ${modelName} ~ \n\nselectedModelApiResponse after generateCompletion:\n\n`, selectedModelApiResponse);
                addApiResponse(modelName, selectedModelApiResponse)
                const { parsedResponse, responseIsJson, isStructuredJson } = extractJsonFromResponse(selectedModelApiResponse);
                console.log(`🚀 ~ POST ~ parsedResponse, responseIsJson, isStructuredJson:`, parsedResponse, responseIsJson, isStructuredJson)

                if (responseIsJson && isStructuredJson) {
                    jsonResponse = parsedResponse;
                    let entries = Object.entries(jsonResponse)
                    let keys = Object.keys(jsonResponse)
                    console.log(`🚀 ~ POST ~ keys:`, keys)
                    console.log(`🚀 ~ POST ~ entries:`, entries)
                    for (const [category, content] of entries) {
                        console.log(`🚀 ~ POST ~ category, content:`, category, content)
                        finalComparativeResponse[category] = {
                            result: content.result,
                            explanation: content.explanation
                        };
                    }
                } else if (responseIsJson) {
                    console.error('JSON response does not have the expected structure');
                    finalComparativeResponse = { unstructured: parsedResponse };
                } else {
                    console.error('Failed to parse response into a valid JSON object');
                    finalComparativeResponse = { raw: selectedModelApiResponse };
                }
            } else {
                throw new Error('Null selectedModelApiResponse returned from generateCompletion');
            }
        } catch (error) {
            results.push({ model: modelName, combination: null, success: false, error: error.message });
            console.error(`🚀 ~ POST ${modelName} ~ Failed to generate combination:`, error);
        }

        console.log('Final Comparative Response:', finalComparativeResponse);

        let reason = "no reason given"

        const alternativeResults = new Set();
        let bestResult = '';

        for (const category in finalComparativeResponse) {
            if (finalComparativeResponse[category] && finalComparativeResponse[category].result) {
                const result = formatResult(finalComparativeResponse[category].result)
                const explanation = finalComparativeResponse[category].explanation;
                alternativeResults.add(result);
                // Assuming 'mostLogical' is the best result, you can change this criteria
                if (category === 'mostLogical') {
                    bestResult = result;
                    reason = explanation || reason;
                }
            }
        }

        const alternativeResultsArray = Array.from(alternativeResults);
        const alternativeResultsString = alternativeResultsArray.join(', ');
        let finalFinalElement

        // const finalFinalPrompt = `
        //     For any of the following combinations of "${element1}" and "${element2}", select the best one based on meaningful combination; giving a logical and/or concrete answer; and the answer will provide the most semantic weight, commonality, and distinctive meaning to best facilitate further combinations.

        //     ${alternativeResultsString}.
        //     Respond with ONLY A 1-3 WORD NOUN or ADVERB-NOUN PHRASE.
        // `

        // finalFinalElement = await generateCompletion(finalFinalPrompt, comparativeModel, { max_tokens: 10 });
        // console.log(`🚀 ~ POST ~ finalFinalElement:`, finalFinalElement)

        // Create the new element object
        const newElement = {
            name: finalFinalElement || bestResult,
            finalComparativeResponse: finalComparativeResponse,
            reason: reason,
            parents: [element1, element2],
            alternativeResults: Array.from(alternativeResults)
        };

        console.log(`🚀 ~ New element created:`, newElement);

        // Return a proper Response object
        return json({
            allResults: results,
            newElement: newElement
        });
    } catch (error) {
        console.error('Error in POST handler:', error);
        // Return a proper Response object even in case of an error
        return json({ allResults: [], error: 'Failed to generate combinations', details: error.message }, { status: 500 });
    }
}


function formatResult(result) {
    const parts = result.split(/[+=]/);
    return parts[parts.length - 1].trim()
        .split(/\s+/)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
}