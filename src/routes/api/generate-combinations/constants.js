const stupidModels = [
    "togethercomputer/stripedhyena-hessian-7b",
]


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

const cheapModel = "openai/gpt-4o-mini-2024-07-18"


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
        7. Avoid portmanteau and novelty coined phrases when possible (opt for concrete things (even if fictional) with existing references)`


export const goodExamples = `
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
