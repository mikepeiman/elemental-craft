import { json } from '@sveltejs/kit';
import initialData from '$lib/data/initialData.json';

export async function GET() {
    return json(initialData);
}