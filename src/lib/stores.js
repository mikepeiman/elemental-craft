import { writable } from 'svelte/store';

export const elements = writable([
    'Water', 'Fire', 'Earth', 'Air', 'Spirit'
]);

export const combinations = writable({});