import { writable } from 'svelte/store';
import { browser } from '$app/environment';

function createPersistentStore(key, initialValue) {
    const storedValue = browser ? localStorage.getItem(key) : null;
    const { subscribe, set, update } = writable(storedValue ? JSON.parse(storedValue) : initialValue);

    return {
        subscribe,
        set: (value) => {
            set(value);
            if (browser) {
                localStorage.setItem(key, JSON.stringify(value));
            }
        },
        update
    };
}

export const elements = createPersistentStore('elements', ['Water', 'Fire', 'Earth', 'Air', 'Spirit']);
export const combinations = createPersistentStore('combinations', {});

export const lastElement1 = writable('');
export const lastElement2 = writable('');
export const lastResult = writable('');

export const lastCombinedElements = writable({
    lastElement1: '',
    lastElement2: '',
    lastResult: ''
})

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