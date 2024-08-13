import { writable } from 'svelte/store';
import { browser } from '$app/environment';

function createElementsStore() {
    const { subscribe, set, update } = writable(['Water', 'Fire', 'Earth', 'Air', 'Spirit']);

    return {
        subscribe,
        set: (value) => {
            set(value);
            if (browser) {
                localStorage.setItem('elements', JSON.stringify(value));
            }
        },
        update: (updater) => {
            update(store => {
                const newStore = updater(store);
                if (browser) {
                    localStorage.setItem('elements', JSON.stringify(newStore));
                }
                return newStore;
            });
        }
    };
}

function createCombinationsStore() {
    const { subscribe, set, update } = writable({});

    return {
        subscribe,
        set: (value) => {
            set(value);
            if (browser) {
                localStorage.setItem('combinations', JSON.stringify(value));
            }
        },
        update: (updater) => {
            update(store => {
                const newStore = updater(store);
                if (browser) {
                    localStorage.setItem('combinations', JSON.stringify(newStore));
                }
                return newStore;
            });
        }
    };
}

export const elements = createElementsStore();
export const combinations = createCombinationsStore();

export const generationStore = (() => {
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
})();

// Initialize stores from localStorage if in browser environment
if (browser) {
    const storedElements = localStorage.getItem('elements');
    const storedCombinations = localStorage.getItem('combinations');

    if (storedElements) {
        elements.set(JSON.parse(storedElements));
    }
    if (storedCombinations) {
        combinations.set(JSON.parse(storedCombinations));
    }
}