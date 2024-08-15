import { writable } from 'svelte/store';
import { browser } from '$app/environment';

function createPersistentStore(key, initialValue) {
    const storedValue = browser ? localStorage.getItem(key) : null;
    const { subscribe, set, update } = writable(storedValue ? JSON.parse(storedValue) : initialValue);

    if (browser) {
        subscribe(value => {
            localStorage.setItem(key, JSON.stringify(value));
        });
    }

    return {
        subscribe,
        set,
        update,
        reset: () => set(initialValue)
    };
}

export const elements = createPersistentStore('elements', [
    { id: 1, content: 'Water', parents: [] },
    { id: 2, content: 'Fire', parents: [] },
    { id: 3, content: 'Earth', parents: [] },
    { id: 4, content: 'Air', parents: [] },
    { id: 5, content: 'Spirit', parents: [] }
]);

export const combinations = createPersistentStore('combinations', {});

export const dragElements = createPersistentStore('dragElements', []);

export const lastCombination = createPersistentStore('lastCombination', {
    element1: '',
    element2: '',
    result: ''
});

export const generationStore = createPersistentStore('generationStore', {
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

export function addElement(content) {
    elements.update(els => {
        const newId = Math.max(0, ...els.map(el => el.id)) + 1;
        return [...els, { id: newId, content, parents: [] }];
    });
}

export function updateLastCombination(element1, element2, result) {
    lastCombination.set({ element1, element2, result });
}


export function addDragElement(element) {
    dragElements.update(els => [...els, {
        ...element,
        width: element.width || 0,
        height: element.height || 0,
        isOverlapping: element.isOverlapping || false,
        isCombining: element.isCombining || false,
        isNewCombo: element.isNewCombo || false
    }]);
}

export function updateDragElement(id, updates) {
    dragElements.update(els => els.map(el => el.id === id ? { ...el, ...updates } : el));
}

export function removeDragElement(id) {
    dragElements.update(els => els.filter(el => el.id !== id));
}