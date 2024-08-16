import { json } from '@sveltejs/kit';
import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const openai = new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: process.env.OPENROUTER_API_KEY,
    defaultHeaders: {
        "HTTP-Referer": process.env.YOUR_SITE_URL,
        "X-Title": process.env.YOUR_SITE_NAME,
    }
});


// Step 2: Cultural Context
const culturalContexts = [
    // Sci-Fi and Futuristic
    "cyberpunk", "steampunk", "space opera", "post-apocalyptic", "solarpunk", "atompunk", "biopunk", "nanopunk", "dieselpunk", "clockpunk",

    // Fantasy and Mythology
    "medieval fantasy", "urban fantasy", "ancient mythology", "Arthurian legend", "Norse mythology", "Lovecraftian horror", "fairy tale", "high fantasy", "low fantasy", "mythic fiction",

    // Historical Periods
    "Victorian era", "Renaissance", "Edo period Japan", "Ancient Egypt", "Roaring Twenties", "Byzantine Empire", "Tang Dynasty China", "Mughal Empire", "Aztec Empire", "Ancient Greece",

    // Modern and Pop Culture
    "1980s pop culture", "1990s grunge", "Y2K aesthetic", "vaporwave", "cottagecore", "dark academia", "afropunk", "hipster", "e-girl/e-boy", "VSCO girl",

    // Genre Mashups
    "Western sci-fi", "prehistoric futurism", "medieval cyberpunk", "steampunk noir", "dieselpunk fantasy", "atomic age horror", "cyberpunk fantasy", "retro-futuristic noir", "gothic western", "tropical gothic",

    // Artistic and Literary Movements
    "surrealism", "magical realism", "expressionism", "art nouveau", "dadaism", "beat generation", "romanticism", "futurism", "brutalism", "bauhaus",

    // Cultural and Subcultural
    "Afrofuturism", "Chicano", "K-pop", "Bollywood", "Nollywood", "Harajuku", "goth", "punk rock", "hip-hop", "rave culture",

    // Technological and Digital
    "virtual reality", "augmented reality", "retro gaming", "crypto-anarchism", "hacker culture", "social media dystopia", "AI singularity", "Internet of Things", "smart cities", "digital nomad",

    // Environmental and Ecological
    "cli-fi (climate fiction)", "eco-gothic", "biomimicry", "rewilding", "deep ecology", "eco-futurism", "urban jungle", "vertical farming", "zero-waste", "aquapunk",

    // Alternative History and Speculative
    "dieselpunk Cold War", "steam-powered space age", "medieval modern", "neo-Victorian", "retro-futurism", "alternate history WWII", "modern stone age", "renaissance punk", "baroque sci-fi", "neon noir",

    // Mythical and Cryptozoological
    "cryptid hunters", "dragon tamers", "mermaid society", "yeti tech", "unicorn punk", "phoenix rising", "kraken industrial", "chimera biotech", "griffon riders", "basilisk cyber",

    // Cosmic and Interdimensional
    "cosmic horror", "multiverse travel", "quantum realm", "astral plane", "dimension hoppers", "time lord society", "wormhole surfers", "parallel universe", "pocket dimension", "cosmic web",

    // Micro and Macro Perspectives
    "subatomic civilization", "giant mech pilots", "microverse explorers", "kaiju handlers", "nanobot swarm", "planetary consciousness", "galactic empire", "quantum society", "hive mind collective", "cosmic entity avatars",

    // Elemental and Natural Forces
    "storm chasers", "lava surfers", "glacier nomads", "solar wind sailors", "earthquake architects", "tornado tamers", "aurora dancers", "tsunami riders", "desert oasis punk", "volcanic islanders",

    // Hybrid and Fusion Cultures
    "Afro-Caribbean steampunk", "Nordic-Japanese fusion", "Greco-Roman Americana", "Indo-Celtic blend", "Sino-African mix", "Polynesian-Nordic alliance", "Russo-Aztec empire", "Franco-Arabian union", "Austro-Incan confederation", "Turko-Maori coalition",

    // Abstract and Conceptual
    "emotion-based society", "synesthesia world", "dream logic reality", "metaphor manifestation", "personified abstract concepts", "living mathematics", "sentient color dimension", "philosophical construct realm", "paradox engineers", "quantum uncertainty shapers",

    // Biological and Evolutionary
    "fungal network society", "insectoid hive", "aquatic mammal utopia", "plant consciousness", "reptilian overlords", "avian sky cities", "cephalopod ink tech", "amoeba shapeshifters", "tardigrade space explorers", "extremophile colonizers",

    // Material and Substance-based
    "crystal-powered civilization", "liquid metal beings", "gaseous entity collective", "plasma energy society", "dark matter manipulators", "antimatter architects", "quantum foam shapers", "string theory weavers", "quark-gluon plasma artists", "Bose-Einstein condensate minds",

    // Temporal and Chronological
    "time loop community", "reverse aging society", "alternate timeline hoppers", "temporal paradox fixers", "chrono-displaced culture", "time dilation explorers", "epochal fusion era", "anachronistic melting pot", "time flow manipulators", "multi-temporal beings",

    // Linguistic and Communication-based
    "telepathic network", "sign language world", "musical language society", "emoji-only communication", "pheromone messaging", "quantum entanglement chatters", "symbolic logic speakers", "onomatopoeic realm", "synesthetic communicators", "thought-form projectors"
];

async function generateCompletion(prompt, max_tokens = 30) {
    const completion = await openai.chat.completions.create({
        model: "meta-llama/llama-3.1-405b",
        // meta-llama/llama-3.1-405b
        // 
        // aetherwiing/mn-starcannon-12b
        messages: [
            { role: "system", content: "You are a creative assistant that combines items in unique ways." },
            { role: "user", content: prompt }
        ],
        max_tokens: max_tokens,
        temperature: 0.8,
    });
    return completion.choices[0].message.content.trim();
}

export async function POST({ request }) {
    const { element1, element2 } = await request.json();

    try {
        // Step 1: Initial Combination
        const initialPrompt = `Combine "${element1}" and "${element2}" into a single concept. It should be as semantically logical a result as possible, using metaphoric reasoning. Provide only the resulting combination as a single word. Single word typically, or at most 2-3 words short phrase. Aim for 1-2 words. No punctuation, capitalize first letters (capital case).`;
        const initialCombination = await generateCompletion(initialPrompt);
        console.log(`🚀 ~ POST ~ initialCombination:`, initialCombination)

        const selectedContext = culturalContexts[Math.floor(Math.random() * culturalContexts.length)];
        const contextPrompt = `Reimagine "${initialCombination}" in the context of ${selectedContext}. Provide a short, evocative phrase describing this reimagined concept.`;
        const contextualizedCombination = await generateCompletion(contextPrompt);
        console.log(`🚀 ~ POST ~ contextPrompt:`, contextPrompt)
        console.log(`🚀 ~ POST ~ contextualizedCombination:`, contextualizedCombination)

        // Step 3: Character/Object Transformation
        const transformationTypes = ["character", "object", "place", "concept", "event"];
        const selectedType = transformationTypes[Math.floor(Math.random() * transformationTypes.length)];
        const transformPrompt = `Transform "${contextualizedCombination}" into a specific ${selectedType}. Give it a name or title that's catchy and memorable.`;
        const transformedCombination = await generateCompletion(transformPrompt);
        console.log(`🚀 ~ POST ~ transformedCombination:`, transformedCombination)

        // Step 4: Pop Culture Injection
        const popCulturePrompt = `Relate "${transformedCombination}" to a well-known pop culture reference, meme, or internet trend. Create a clever mashup or reference. Add a layer of wordplay, pun, or clever linguistic twist to it.`;
        const popCultureCombination = await generateCompletion(popCulturePrompt);
        console.log(`🚀 ~ POST ~ popCultureCombination:`, popCultureCombination)

        // Step 5: Wordplay Pass
        const wordplayPrompt = `Now reduce "${popCultureCombination}" to a single word (preferably) or at most a two- to three-word phrase. Return ONLY the word(s) and no punctuation. It MUST be only onel, two or three words at most.`;
        const combination = await generateCompletion(wordplayPrompt);
        console.log(`🚀 ~ POST ~ combination:`, combination)

        return json({
            initialCombination,
            contextualizedCombination,
            transformedCombination,
            popCultureCombination,
            combination
        });
    } catch (error) {
        console.error('Error generating combination:', error);
        return json({ error: 'Failed to generate combination' }, { status: 500 });
    }
}