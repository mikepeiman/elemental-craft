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

    console.log(`🚀 ~ generateCombination ~ response:`, response)
    if (response.ok) {
      const data = await response.json();
      console.log(`🚀 ~ generateCombination ~ data: ALL RESULTS for \n\n ***************${element1} + ${element2}  ***************** \n\n`, data);

      const { content: newElementName, reason, parents } = data.newElement;

      if (typeof newElementName !== 'string' || newElementName.length === 0) {
        throw new Error('Invalid newElementName received from server');
      }

      // Update stores
      combinations.update(c => ({ ...c, [key]: newElementName }));
      elements.update(e => {
        if (!e.some(el => el.content === newElementName)) {
          return [...e, {
            id: Date.now(),
            content: newElementName,
            parents: parents || [element1, element2],
            reason: reason || null
          }];
        }
        return e;
      });

      console.log(`***API CALL*** Generated: ${element1} + ${element2} = ${newElementName}`);
      console.log(`Reason: ${reason || 'No reason provided'}`);
      updateLastCombination(element1, element2, newElementName);
      return newElementName;
    } else {
      throw new Error(`Server responded with status: ${response.status}`);
    }
  } catch (error) {
    console.error('Error generating combination:', error);
    return null;
  }
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