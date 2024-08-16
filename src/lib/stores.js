// $lib/stores.js

import { writable } from 'svelte/store';
import { browser } from '$app/environment';

function createPersistentStore(key, initialValue) {
    const store = writable(initialValue);

    if (browser) {
        const storedValue = localStorage.getItem(key);
        if (storedValue) {
            store.set(JSON.parse(storedValue));
        }

        store.subscribe(value => {
            localStorage.setItem(key, JSON.stringify(value));
        });
    }

    return {
        ...store,
        reset: () => {
            store.set(initialValue);
            if (browser) {
                localStorage.setItem(key, JSON.stringify(initialValue));
            }
        }
    };
}


export const elements = createPersistentStore('elements', [
    { id: 1, content: 'Water', parents: [] },
    { id: 2, content: 'Fire', parents: [] },
    { id: 3, content: 'Earth', parents: [] },
    { id: 4, content: 'Wind', parents: [] },
    { id: 5, content: 'Spirit', parents: [] }
]);

// { id: 6, content: 'Math', parents: [] },
// { id: 7, content: 'Geometry', parents: [] },
// { id: 8, content: 'Music', parents: [] },
// { id: 9, content: 'Cell', parents: [] },
// { id: 10, content: 'Humor', parents: [] },

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

let nextId = Date.now();

function getNextId() {
    return nextId++;
}

export function addDragElement(element) {
    dragElements.update(els => {
        const newElement = {
            ...element,
            id: getNextId(),
            x: element.x || 0,
            y: element.y || 0
        };
        return [...els, newElement];
    });
}

export function updateDragElement(id, updates) {
    dragElements.update(els =>
        els.map(el => el.id === id ? { ...el, ...updates, x: updates.x ?? el.x, y: updates.y ?? el.y } : el)
    );
}

export function removeDragElement(id) {
    dragElements.update(els => els.filter(el => el.id !== id));
}

export function deleteElement(id) {
    elements.update(els => els.filter(el => el.id !== id));
    dragElements.update(els => els.filter(el => el.id !== id));
    combinations.update(combos => Object.fromEntries(Object.entries(combos).filter(([key]) => !key.includes(id.toString()))));


}


export function initializeNextId(elements) {
    nextId = Math.max(...elements.map(el => el.id), 0) + 1;
}

export function updateLastCombination(element1, element2, result) {
    lastCombination.set({ element1, element2, result });
}

// Add these functions for the generationStore
export function startGeneration() {
    generationStore.update(state => ({ ...state, isGenerating: true, shouldStop: false }));
}

export function stopGeneration() {
    generationStore.update(state => ({ ...state, shouldStop: true }));
}

export function resetGeneration() {
    generationStore.set({ isGenerating: false, shouldStop: false });
}

export const serverResponses = createPersistentStore('serverResponses', {});

// Add these helper functions for the serverResponses store
export function addServerResponse(modelName, response) {
    console.log(`🚀 ~ addServerResponse ~ response:`, response)
    console.log(`🚀 ~ addServerResponse ~ modelName:`, modelName)
    serverResponses.update(store => {
        const newStore = { ...store };
        if (!newStore[modelName]) {
            newStore[modelName] = [];
        }
        newStore[modelName] = [...newStore[modelName], response];
        return newStore;
    });
}

export function resetServerResponses() {
    serverResponses.reset();
}