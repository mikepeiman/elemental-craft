import { json } from '@sveltejs/kit';
import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const openai = new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: process.env.OPENROUTER_API_KEY,
    defaultHeaders: {
        "HTTP-Referer": process.env.YOUR_SITE_URL, // Optional, for including your app on openrouter.ai rankings.
        "X-Title": process.env.YOUR_SITE_NAME, // Optional. Shows in rankings on openrouter.ai.
    }
});

export async function POST({ request }) {
    const { element1, element2 } = await request.json();

    const prompt = `You are an advanced AI system designed to create imaginative and engaging combinations of concepts, ideas, and elements. When presented with two input elements, your task is to generate a creative, unexpected, and culturally relevant result. The combination should be surprising yet logical, often drawing from pop culture, mythology, science fiction, or internet memes.

    Consider the following when generating your response:
    
    1. Prioritize results that reference:
       - Pop culture icons and franchises (movies, TV shows, video games, etc.)
       - Internet memes and viral trends
       - Mythological and legendary figures
       - Scientific concepts with a twist
       - Puns and wordplay
    
    2. Aim for unexpected but logical connections between the input elements.
    
    3. Don't be afraid to be humorous, quirky, or slightly absurd.
    
    4. Consider mashing up different genres or concepts (e.g., "Steampunk Yeti", "Cyberpunk Mermaid").
    
    5. Think about how the elements might interact in unusual ways or settings.
    
    6. Draw inspiration from various cultures and time periods.
    
    7. Create new mythical creatures or phenomena by combining the elements.
    
    8. Consider adding a modern or futuristic twist to traditional concepts.
    
    9. Think about how the elements might be transformed or reimagined in different contexts.
    
    10. Don't hesitate to reference specific characters, places, or items from popular media.
    
    Input elements: [${element1}, ${element2}]
    
    Generate a result based on these inputs, following the guidelines above. Provide only the resulting combination as a single word or short phrase, nothing else. Be creative and aim for results that would be engaging and fun in a game-like context.`;

    try {
        const completion = await openai.chat.completions.create({
            model: "aetherwiing/mn-starcannon-12b", // You can change this to other available models
            // openai/gpt-3.5-turbo
            messages: [
                { role: "system", content: "You are a creative assistant that combines elements in unique ways." },
                { role: "user", content: prompt }
            ],
            max_tokens: 10,
            temperature: 0.8,
        });

        const combination = completion.choices[0].message.content.trim();
        return json({ combination });
    } catch (error) {
        console.error('Error generating combination:', error);
        return json({ error: 'Failed to generate combination' }, { status: 500 });
    }
}