// $lib/stores.js

import { writable, get } from 'svelte/store';
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
    console.log(`🚀 ~ STORES.js stopGeneration ~ stopGeneration`)
    generationStore.update(state => ({ ...state, shouldStop: true }));
}

export function resetGeneration() {
    generationStore.set({ isGenerating: false, shouldStop: false });
}

export const serverResponses = createPersistentStore('serverResponses', {});

// Add these helper functions for the serverResponses store
export function addServerResponse(modelName, isSuccess, result) {
    serverResponses.update(store => {
        const newStore = { ...store };
        if (!newStore[modelName]) {
            newStore[modelName] = {
                errorCount: 0,
                successCount: 0,
                results: [],
                timestamps: []
            };
        }

        newStore[modelName] = {
            errorCount: isSuccess ? newStore[modelName].errorCount : newStore[modelName].errorCount + 1,
            successCount: isSuccess ? newStore[modelName].successCount + 1 : newStore[modelName].successCount,
            results: [...newStore[modelName].results, result],
            timestamps: [...newStore[modelName].timestamps, Date.now()]
        };

        return newStore;
    });
}

export const extendedModelNames = [
    "meta-llama/llama-2-13b-chat",
    "google/palm-2-chat-bison", // mixed
    "qwen/qwen-14b-chat", // mixed
    "deepseek/deepseek-chat", // some good, some mixed
    "meta-llama/llama-2-70b-chat", // pretty good
    "microsoft/wizardlm-2-8x22b", // pretty good
    "perplexity/llama-3.1-sonar-small-128k-online", // okay
    "mistralai/mistral-tiny", // okay, poor at following instructions
    "mistralai/mixtral-8x7b-instruct",
    "aetherwiing/mn-starcannon-12b", // very good
    "gryphe/mythomax-l2-13b", // pretty good
    "austism/chronos-hermes-13b", // mixed
    "anthropic/claude-3.5-sonnet:beta", // good
    "anthropic/claude-3-haiku", // decent
    "openai/chatgpt-4o-latest", // very good
    "openai/gpt-4o-mini-2024-07-18", // okay
    "nousresearch/hermes-2-pro-llama-3-8b",
    "austism/chronos-hermes-13b",
    "nousresearch/hermes-3-llama-3.1-405b",
    "nousresearch/hermes-2-theta-llama-3-8b",
    "nousresearch/nous-hermes-2-mistral-7b-dpo"
];

export const extendedModelNames2 = [
    "nousresearch/hermes-2-pro-llama-3-8b",
    "austism/chronos-hermes-13b",
    "nousresearch/hermes-3-llama-3.1-405b",
    "nousresearch/hermes-2-theta-llama-3-8b",
    "nousresearch/nous-hermes-2-mistral-7b-dpo",
    "aetherwiing/mn-starcannon-12b", // very good
    "gryphe/mythomax-l2-13b", // pretty good
    "meta-llama/llama-2-70b-chat", // pretty good
    "microsoft/wizardlm-2-8x22b", // pretty good
]

export function resetServerResponses() {
    serverResponses.reset();
}

// serverResponsesHelper.js
// Function to save serverResponses to a local file
export function saveServerResponsesToFile() {
    const data = JSON.stringify(get(serverResponses));
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'serverResponses.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Function to load serverResponses from a local file
export function loadServerResponsesFromFile() {
    return new Promise((resolve, reject) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';

        input.onchange = (event) => {
            const file = event.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    try {
                        const data = JSON.parse(e.target.result);
                        serverResponses.set(data);
                        resolve('Server responses loaded successfully');
                    } catch (error) {
                        reject('Error parsing file: ' + error.message);
                    }
                };
                reader.onerror = (error) => reject('Error reading file: ' + error.message);
                reader.readAsText(file);
            } else {
                reject('No file selected');
            }
        };

        input.click();
    });
}