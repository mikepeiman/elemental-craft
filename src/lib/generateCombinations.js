// $lib/generateCombinations.js

import { get } from 'svelte/store';
import { elements, combinations, generationStore, updateLastCombination } from './stores.js';

export async function generateCombination(element1, element2) {
  const key = [element1, element2].sort().join(',');
  const existingCombination = get(combinations)[key];

  if (existingCombination) {
    updateLastCombination(element1, element2, existingCombination);
    return existingCombination;
  }

  try {
    const response = await fetch('/api/generate-combinations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ element1, element2 })
    });

    if (response.ok) {
      const { combination } = await response.json();

      // Update stores
      combinations.update(c => ({ ...c, [key]: combination }));
      elements.update(e => {
        if (!e.some(el => el.content === combination)) {
          return [...e, { id: Date.now(), content: combination, parents: [element1, element2] }];
        }
        return e;
      });

      console.log(`Generated: ${element1} + ${element2} = ${combination}`);
      updateLastCombination(element1, element2, combination);
      return combination;
    }
  } catch (error) {
    console.error('Error generating combination:', error);
  }

  return null;
}

export async function generateRandomCombinations(count) {
  generationStore.update(state => ({ ...state, isGenerating: true, shouldStop: false }));

  for (let i = 0; i < count; i++) {
    const generationState = get(generationStore);
    if (generationState.shouldStop) {
      break;
    }

    const elementArray = get(elements);
    const element1 = elementArray[Math.floor(Math.random() * elementArray.length)].content;
    const element2 = elementArray[Math.floor(Math.random() * elementArray.length)].content;

    if (element1 !== element2) {
      await generateCombination(element1, element2);
    }

    // Add a small delay to allow for smoother stopping
    await new Promise(resolve => setTimeout(resolve, 10));
  }

  generationStore.update(state => ({ ...state, isGenerating: false, shouldStop: false }));
}