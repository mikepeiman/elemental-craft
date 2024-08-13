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

    const prompt = `You are an advanced AI system designed to create meaningful combinations of concepts, ideas, and elements. When presented with two input elements, your task is to generate a semantically rich, meaningful, logical result. It should be the most sensible and obvious result; but if the combination is not intuitive, the result should be. 

Consider the following when generating your response:

Draw from a wide range of knowledge including history, science, literature, pop culture, mythology, technology, and current events.
The result should be a realworld word, phrase, concept, or idea that has significance or meaning in human culture or knowledge.
Look for thematic, symbolic, or conceptual connections between the input elements, rather than just linguistic similarities.
Consider how the input elements might interact, influence each other, or combine to create something new and meaningful.
The result can be abstract or concrete, ranging from philosophical concepts to tangible objects or well-known cultural references.
Avoid novel portmantaeus or nonsense combinations.
Aim for results with these priorities:
1. Realworld and concrete objects
2. Commonplace items and ideas
3. Well-known historical or cultural references (from trendy, modern pop culture to classical and antiquity)
4. Ideas that are interesting, thought-provoking, profound
5. Ideas that are humorous, sacarstic, satirical


Input elements: [${element1}, ${element2}]

Generate a result based on these inputs, following the guidelines above. Provide only the resulting combination as a single word or short phrase, nothing else.`;

    try {
        const completion = await openai.chat.completions.create({
            model: "openai/gpt-3.5-turbo", // You can change this to other available models
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