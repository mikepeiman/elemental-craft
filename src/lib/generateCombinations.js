// $lib/generateCombinations.js

import { get } from 'svelte/store';
import { elements, combinations, updateLastCombination } from './stores.js';

export async function generateCombination(element1, element2) {
  const key = [element1, element2].sort().join(',');
  const existingCombination = get(combinations)[key];

  if (existingCombination) {
    updateLastCombination(element1, element2, existingCombination);
    return existingCombination;
  }

  try {
    console.log(`***API CALL*** Generating: ${element1} + ${element2}`);
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

      console.log(`***API CALL*** Generated: ${element1} + ${element2} = ${combination}`);
      updateLastCombination(element1, element2, combination);
      return combination;
    }
  } catch (error) {
    console.error('Error generating combination:', error);
  }

  return null;
}

let shouldStopGeneration = false;

export async function generateRandomCombinations(count) {
  let shouldStopGeneration = false;
  let generatedCombinations = 0;
  let attempts = 0;
  const maxAttempts = count * 10; // Adjust this multiplier as needed

  while (generatedCombinations < count && attempts < maxAttempts) {
    attempts++;
    console.log(`🚀 ~ generateRandomCombinations ~ attempt:`, attempts);

    if (shouldStopGeneration) {
      console.log("Generation stopped by user.");
      break;
    }

    const elementArray = get(elements);
    const element1 = elementArray[Math.floor(Math.random() * elementArray.length)].content;
    const element2 = elementArray[Math.floor(Math.random() * elementArray.length)].content;

    const [smallerEl, largerEl] = [element1, element2].sort();
    const key = `${smallerEl},${largerEl}`;
    console.log(`🚀 ~ generateRandomCombinations ~ key:`, key);
    console.log(`🚀 ~ generateRandomCombinations ~ element1, element2:`, smallerEl, largerEl);

    const currentCombinations = get(combinations);
    const existingCombination = currentCombinations[key];
    console.log(`🚀 ~ generateRandomCombinations ~ existingCombination:`, existingCombination);

    if (existingCombination) {
      console.log(`Combination already exists: ${smallerEl} + ${largerEl} = ${existingCombination}`);
      updateLastCombination(smallerEl, largerEl, existingCombination);
    } else {
      const newCombination = await generateCombination(smallerEl, largerEl);
      if (newCombination) {
        generatedCombinations++;
        console.log(`Generated new combination: ${smallerEl} + ${largerEl} = ${newCombination}`);
        combinations.update(c => ({ ...c, [key]: newCombination }));
        updateLastCombination(smallerEl, largerEl, newCombination);
      }
    }

    // Add a small delay to allow for smoother stopping
    await new Promise(resolve => setTimeout(resolve, 10));
  }

  if (attempts >= maxAttempts) {
    console.warn(`Reached maximum attempts (${maxAttempts}) before generating ${count} combinations.`);
  }

  console.log(`Generated ${generatedCombinations} new combinations in ${attempts} attempts.`);
  shouldStopGeneration = false;
}

export function stopRandomGeneration() {
  shouldStopGeneration = true;
}