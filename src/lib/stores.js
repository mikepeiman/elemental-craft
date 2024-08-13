import { writable } from 'svelte/store';

export const elements = writable([
    'Water', 'Fire', 'Earth', 'Air', 'Spirit'
]);

export const combinations = writable({});

function createGenerationStore() {
    const { subscribe, set, update } = writable({
        isGenerating: false,
        shouldStop: false
    });

    return {
        subscribe,
        startGeneration: () => update(state => ({ ...state, isGenerating: true, shouldStop: false })),
        stopGeneration: () => update(state => ({ ...state, shouldStop: true })),
        reset: () => set({ isGenerating: false, shouldStop: false })
    };
}

export const generationStore = createGenerationStore();