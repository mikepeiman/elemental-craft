import { get } from 'svelte/store';
import { elements, combinations, generationStore } from './stores.js';
import { lastElement1, lastElement2, lastResult } from './stores.js';

export async function generateCombination(element1, element2) {
  const key = [element1, element2].sort().join(',');
  const existingCombination = get(combinations)[key];

  if (existingCombination) {
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
        if (!e.includes(combination)) {
          return [...e, combination];
        }
        return e;
      });

      console.log(`Generated: ${element1} + ${element2} = ${combination}`);
      updateRecentStore(element1, element2, combination);
      return combination;
    }
  } catch (error) {
    console.error('Error generating combination:', error);
  }

  return null;
}

function updateRecentStore(newEl1, newEl2, newResult) {
  console.log(`🚀 ~ updateRecentStore ~ newEl1, newEl2, newResult:`, newEl1, newEl2, newResult)
  lastElement1.update(() => newEl1);
  lastElement2.update(() => newEl2);
  lastResult.update(() => newResult);

}

export async function generateRandomCombinations(count) {
  generationStore.startGeneration();

  for (let i = 0; i < count; i++) {
    const generationState = get(generationStore);
    if (generationState.shouldStop) {
      break;
    }

    const elementArray = get(elements);
    const element1 = elementArray[Math.floor(Math.random() * elementArray.length)];
    const element2 = elementArray[Math.floor(Math.random() * elementArray.length)];

    if (element1 !== element2) {
      await generateCombination(element1, element2);
    }

    // Add a small delay to allow for smoother stopping
    await new Promise(resolve => setTimeout(resolve, 10));
  }

  generationStore.reset();
}