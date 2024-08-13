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

    const prompt = `Combine these two elements in a creative and often humorous way: "${element1}" and "${element2}". Provide only the resulting combination as a single word or short phrase, nothing else.`;

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