import { get } from 'svelte/store';
import { elements, combinations } from './stores.js';

export async function generateCombinations(initialElements, targetCount) {
  const generatedCombinations = new Map();
  const elementSet = new Set(initialElements);

  while (generatedCombinations.size < targetCount) {
    const elementArray = Array.from(elementSet);
    const element1 = elementArray[Math.floor(Math.random() * elementArray.length)];
    const element2 = elementArray[Math.floor(Math.random() * elementArray.length)];

    if (element1 !== element2) {
      const key = [element1, element2].sort().join(',');

      if (!generatedCombinations.has(key)) {
        try {
          const response = await fetch('/api/generate-combinations', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ element1, element2 })
          });

          if (response.ok) {
            const { combination } = await response.json();
            generatedCombinations.set(key, combination);
            elementSet.add(combination);

            // Update stores
            combinations.update(c => ({ ...c, [key]: combination }));
            elements.update(e => [...e, combination]);

            console.log(`Generated: ${element1} + ${element2} = ${combination}`);
          }
        } catch (error) {
          console.error('Error generating combination:', error);
        }
      }
    }
  }

  return Object.fromEntries(generatedCombinations);
}