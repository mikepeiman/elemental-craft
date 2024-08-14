import { writable } from 'svelte/store';
import { browser } from '$app/environment';

function createPersistentStore(key, initialValue) {
    const storedValue = browser ? localStorage.getItem(key) : null;
    const store = writable(storedValue ? JSON.parse(storedValue) : initialValue);

    if (browser) {
        store.subscribe(value => {
            localStorage.setItem(key, JSON.stringify(value));
        });
    }

    return {
        ...store,
        reset: () => store.set(initialValue)
    };
}

const initialElements = [
    { id: 1, content: 'Water', parents: [], x: 0, y: 0, width: 0, height: 0, isOverlapping: false, isCombining: false, isNewCombo: false },
    { id: 2, content: 'Fire', parents: [], x: 0, y: 0, width: 0, height: 0, isOverlapping: false, isCombining: false, isNewCombo: false },
    { id: 3, content: 'Earth', parents: [], x: 0, y: 0, width: 0, height: 0, isOverlapping: false, isCombining: false, isNewCombo: false },
    { id: 4, content: 'Air', parents: [], x: 0, y: 0, width: 0, height: 0, isOverlapping: false, isCombining: false, isNewCombo: false },
    { id: 5, content: 'Spirit', parents: [], x: 0, y: 0, width: 0, height: 0, isOverlapping: false, isCombining: false, isNewCombo: false }
];

export const elements = createPersistentStore('elements', initialElements);
export const combinations = createPersistentStore('combinations', {});

export const lastElement1 = writable({ content: '' });
export const lastElement2 = writable({ content: '' });
export const lastResult = writable({ content: '' });

export const generationStore = writable({
    isGenerating: false,
    shouldStop: false
});

export function startGeneration() {
    generationStore.update(state => ({ ...state, isGenerating: true, shouldStop: false }));
}

export function stopGeneration() {
    generationStore.update(state => ({ ...state, shouldStop: true }));
}

export function resetGeneration() {
    generationStore.set({ isGenerating: false, shouldStop: false });
}