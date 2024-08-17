<script>
	import { onMount } from 'svelte';
	import { draggable } from '@neodrag/svelte';

	import {
		elements,
		dragElements,
		lastCombination,
		combinations,
		addDragElement,
		updateDragElement,
		removeDragElement,
		initializeNextId,
		updateLastCombination,
		deleteElement,
		addServerResponse,
		serverResponses,
		saveServerResponsesToFile,
		loadServerResponsesFromFile,
		extendedModelNames,
		selectedModels
	} from '$lib/stores.js';
	$: console.log(`🚀 ~ selectedModels in E7:`, $selectedModels);

	// import {
	// 	generateCombination,
	// 	generateRandomCombinations,
	// 	stopRandomGeneration
	// } from '$lib/generateCombinations.js';
	import ModelSelector from './ModelSelector.svelte';
	import { get } from 'svelte/store';

	$: console.log(`🚀 ~ $serverResponses:`, $serverResponses);

	let mainArea;
	let draggedElement = null;
	let overlappingPair = null;
	let dragOffset = { x: 0, y: 0 };
	let combiningElements = null;
	let randomCombinationCount = 5;
	let isGenerating = false;

	onMount(() => {
		// mainArea = document.getElementById('main-area');
		initializeNextId($dragElements);
		console.log('🚀 ~ onMount ~ Component mounted');
	});

	// $lib/generateCombinations.js

	// import { elements, combinations, updateLastCombination, addServerResponse } from '$lib/stores.js';

	function handleResponseApiLogs(el1, el2, responseData) {
		console.log(
			`🚀 ~ handleResponseApiLogs FROM GENERATECOMBINATIONS.js ~ el1, el2, responseData:`,
			el1,
			el2,
			responseData
		);
		if (responseData && responseData.allResults) {
			responseData.allResults.forEach((result) => {
				// addServerResponse(result.model, result.success, `${el1} + ${el2}: ${result.combination}`); // used this before I expanded element properties
				addServerResponse(
					result.model,
					result.success,
					`${el1} + ${el2}: ${responseData.newElement.name} \n ${responseData.newElement.alternativeResults.join(', ')}`
				);
			});
		}
	}
	export async function generateCombination(element1, element2, modelName) {
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
				body: JSON.stringify({ element1, element2, modelName })
			});

			console.log(`🚀 ~ generateCombination ~ response:`, response);
			if (response.ok) {
				const data = await response.json();
				// addServerResponse(selectedModel, {
				//   type: 'success',
				//   response: data,
				//   timestamp: new Date().toISOString()
				// });
				console.log(
					`🚀 ~ generateCombination ~ data: ALL RESULTS for \n\n ***************${element1} + ${element2}  ***************** \n\n`,
					data
				);

				handleResponseApiLogs(element1, element2, data);

				const {
					name: newElementName,
					reason,
					finalComparativeResponse,
					alternativeResults,
					parents
				} = data.newElement;

				if (typeof newElementName !== 'string' || newElementName.length === 0) {
					throw new Error('Invalid newElementName received from server');
				}

				// Update stores
				combinations.update((c) => ({ ...c, [key]: newElementName }));
				elements.update((e) => {
					if (!e.some((el) => el.content === newElementName)) {
						return [
							...e,
							{
								id: Date.now(),
								content: newElementName,
								alternativeResults: alternativeResults || [],
								finalComparativeResponse: finalComparativeResponse || null,
								parents: parents || [element1, element2],
								reason: reason || null
							}
						];
					}
					return e;
				});

				console.log(`***API CALL*** Generated: ${element1} + ${element2} = ${newElementName}`);
				console.log(`Reason: ${reason || 'No reason provided'}`);

				let returnObject = {
					data: data,
					newElementName: newElementName
				};
				console.log(`🚀 ~ generateCombination ~ returnObject:`, returnObject);
				updateLastCombination(element1, element2, newElementName);
				return returnObject;
			} else {
				// addServerResponse(selectedModel, {
				//   type: response.status,
				//   error: response || 'Unknown error',
				//   timestamp: new Date().toISOString()
				// });
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
				console.log('Generation stopped by user.');
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
				console.log(
					`Combination already exists: ${smallerEl} + ${largerEl} = ${existingCombination}`
				);
				updateLastCombination(smallerEl, largerEl, existingCombination);
			} else {
				const response = await generateCombination(smallerEl, largerEl, modelName);

				const { newElementName } = response || {};
				const { data } = response || {};

				if (newElementName) {
					generatedCombinations++;
					console.log(`Generated new combination: ${smallerEl} + ${largerEl} = ${newElementName}`);
					combinations.update((c) => ({ ...c, [key]: newElementName }));
					updateLastCombination(smallerEl, largerEl, newElementName);
				}
			}

			// Add a small delay to allow for smoother stopping
			await new Promise((resolve) => setTimeout(resolve, 10));
		}

		if (attempts >= maxAttempts) {
			console.warn(
				`Reached maximum attempts (${maxAttempts}) before generating ${count} combinations.`
			);
		}

		console.log(`Generated ${generatedCombinations} new combinations in ${attempts} attempts.`);
		shouldStopGeneration = false;
	}

	export function stopRandomGeneration() {
		shouldStopGeneration = true;
	}

	function handleDragStart(event, element) {
		console.log(`🚀 ~ handleDragStart ~ element:`, element);
		draggedElement = element;
		const rect = event.target.getBoundingClientRect();
		dragOffset.x = event.clientX - rect.left;
		dragOffset.y = event.clientY - rect.top;
		event.dataTransfer.setData('text/plain', JSON.stringify(element));
	}

	function handleDragOver(event) {
		event.preventDefault();
		event.dataTransfer.dropEffect = 'move';
	}

	function handleDrop(event) {
		console.log('🚀 ~ handleDrop');
		event.preventDefault();
		const x = event.clientX - mainArea.offsetLeft - dragOffset.x;
		const y = event.clientY - mainArea.offsetTop - dragOffset.y;

		if (draggedElement) {
			console.log('🚀 ~ handleDrop ~ Adding new element:', draggedElement);
			addDragElement({ ...draggedElement, x, y });
		}

		draggedElement = null;
		overlappingPair = null;
	}

	function handleNeoDrag(event, id) {
		// console.log('🚀 ~ handleNeoDrag ~ id:', id);
		const { offsetX, offsetY } = event.detail;
		updateDragElement(id, { x: offsetX, y: offsetY });
		checkOverlap(id);
	}

	async function handleNeoDragEnd(event, id) {
		console.log(`🚀 ~ handleNeoDragEnd ~ event:`, event);
		console.log(`🚀 ~ handleNeoDragEnd ~ id:`, id);
		const { offsetX, offsetY } = event.detail;
		let x = offsetX;
		let y = offsetY;
		updateDragElement(id, { x, y });
		const item = $dragElements.find((item) => {
			return item.id === id;
		});
		console.log(`🚀 ~ handleNeoDragEnd ~ item:`, item);
		checkOverlap(id);

		if (overlappingPair) {
			console.log('🚀 ~ handleNeoDragEnd ~ Overlapping pair found:', overlappingPair);
			const [element1, element2] = overlappingPair;
			if (element1 && element2) {
				console.log('🚀 ~ handleNeoDragEnd ~ Both elements exist, attempting to combine');
				await combineElements(element1, element2, x, y);
			} else {
				console.log('🚀 ~ handleNeoDragEnd ~ One or both elements are undefined', {
					element1,
					element2
				});
			}
		} else {
			console.log('🚀 ~ handleNeoDragEnd ~ No overlapping pair found');
		}
		overlappingPair = null;
	}

	/**
	 * @type {any}
	 */
	let responseData;

	async function combineElements(element1, element2, x, y) {
		console.log(`🚀 ~ combineElements ~ element1, element2, x, y:`, element1, element2, x, y);
		if (!element1 || !element2) {
			console.log(
				'🚀 ~ combineElements ~ One or both elements are undefined, aborting combination'
			);
			return;
		}

		const [smallerEl, largerEl] = [element1.content, element2.content].sort();
		const combinationKey = `${smallerEl},${largerEl}`;

		let newElement;
		if ($combinations[combinationKey]) {
			newElement = $combinations[combinationKey];
			console.log('🚀 ~ combineElements ~ Using existing combination:', newElement);
		} else {
			let generationResults = await generateCombination(smallerEl, largerEl, modelName);
			console.log('🚀 ~ combineElements ~ Generating new combination');
			console.log(`🚀 ~ combineElements ~ generationResults:`, generationResults);
			newElement = generationResults['newElementName'];
			console.log('🚀 ~ combineElements ~ Generated new combination:', newElement);

			let responseData = generationResults['data'];
			console.log(`🚀 ~ combineElements ~ responseData:\n\n`, responseData);
			responseData.allResults.forEach((result) => {
				console.log(
					`%c${result.model}\n --- %c${smallerEl} + ${largerEl} = ${result.combination}, 'font-size: .75rem; color: black;', 'font-size: 1.25rem; color: blue;'`
				);
			});

			if (newElement) {
				combinations.update((c) => ({ ...c, [combinationKey]: newElement }));
			}
		}

		if (newElement) {
			console.log('🚀 ~ combineElements ~ Creating new combined element');
			removeDragElement(element1.id);
			removeDragElement(element2.id);
			addDragElement({
				content: newElement,
				x,
				y,
				isNew: true,
				parents: [element1.content, element2.content]
			});
			updateLastCombination(smallerEl, largerEl, newElement);
		} else {
			console.log('🚀 ~ combineElements ~ Combination failed, no new element created');
		}
	}

	function logServerResponses() {
		$selectedModels.forEach((modelName) => {
			if ($serverResponses[modelName]) {
				console.log(
					`%cModel: ${modelName}`,
					'color: #0fcfff; font-weight: bold; font-size: 1.5rem;'
				);

				const properties = $serverResponses[modelName];
				console.log(
					`%cSuccess Count: ${properties.successCount}`,
					'color: #00ff00; font-weight: bold;'
				);
				console.log(
					`%cError Count: ${properties.errorCount}`,
					'color: #ff0000; font-weight: bold;'
				);

				properties.results.forEach((result, index) => {
					console.log(
						`%cResult ${index + 1}: %c${result}`,
						'color: #ffaa00; font-weight: bold;',
						'color:black; font-weight: normal; font-size: 1.25rem;'
					);
				});

				console.log('\n'); // Add a newline for better separation between models
			}
		});
	}
	function checkOverlap(id) {
		// console.log('🚀 ~ checkOverlap ~ id:', id);
		const currentElement = document.querySelector(`[data-id="${id}"]`);
		if (!currentElement) {
			console.log('🚀 ~ checkOverlap ~ Current element not found');
			return;
		}

		const currentRect = currentElement.getBoundingClientRect();
		const otherElements = document.querySelectorAll(
			'.draggable-element:not([data-id="' + id + '"])'
		);

		overlappingPair = null;
		for (let element of otherElements) {
			if (isOverlapping(currentRect, element.getBoundingClientRect())) {
				overlappingPair = [
					$dragElements.find((el) => el.id === id),
					$dragElements.find((el) => el.id === parseInt(element.dataset.id))
				];
				// console.log('🚀 ~ checkOverlap ~ Overlap found:', overlappingPair);
				return;
			}
		}
		// console.log('🚀 ~ checkOverlap ~ No overlap found');
	}

	function isOverlapping(rect1, rect2) {
		const result = !(
			rect1.right < rect2.left ||
			rect1.left > rect2.right ||
			rect1.bottom < rect2.top ||
			rect1.top > rect2.bottom
		);
		// console.log('🚀 ~ isOverlapping ~ result:', result);
		return result;
	}

	function handleClick(event, id) {
		console.log('🚀 ~ handleDoubleClick ~ id:', id);
		event.preventDefault();
		let bounds = mainArea.getBoundingClientRect();
		let randomX = Math.floor(Math.random() * (bounds.width - 100)) + 50;
		let randomY = Math.floor(Math.random() * (bounds.height - 100)) + 50;

		const element = $elements.find((el) => el.id === id);
		if (element) {
			const newElement = { ...element };
			newElement.id = Date.now();
			newElement.x = randomX;
			newElement.y = randomY;
			addDragElement(newElement);
		}
	}
	let contextMenu = {
		show: false,
		x: 0,
		y: 0,
		elementId: ''
	};
	function showContextMenu(event, id) {
		event.preventDefault();
		contextMenu = {
			show: true,
			x: event.clientX,
			y: event.clientY,
			elementId: id
		};
	}

	function hideContextMenu() {
		contextMenu = { show: false, x: 0, y: 0, elementId: null };
	}

	function handleDelete() {
		if (contextMenu.elementId) {
			deleteElement(contextMenu.elementId);
			removeDragElement(id);
			hideContextMenu();
		}
	}

	// Update the existing handleContextMenu function
	function removeFromCombinationArea(event, id) {
		console.log('🚀 ~ handleContextMenu ~ id:', id);
		event.preventDefault();
		// showContextMenu(event, id);
		removeDragElement(id);
	}
</script>

<!-- Rest of your component remains the same -->

<!-- svelte-ignore a11y-no-static-element-interactions -->
<div class="flex h-full w-screen bg-gray-900 text-gray-200">
	<!-- Left Sidebar -->
	<div class="w-1/4 p-4 border-r border-gray-700 overflow-y-auto">
		<h2 class="text-2xl font-semibold mb-4">Elements</h2>
		<div class="flex flex-wrap gap-2">
			{#each $elements as item (item.id)}
				<div
					draggable="true"
					on:click={(e) => handleClick(e, item.id)}
					on:dragstart={(e) => handleDragStart(e, item)}
					on:contextmenu={(e) => showContextMenu(e, item.id)}
					class="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors cursor-move"
				>
					{item.content}
				</div>
			{/each}
		</div>
	</div>

	<!-- Central Graph View -->
	<div id="main-panel" class="w-3/4 p-4 h-full relative">
		<div class="flex justify-between items-around">
			<div class="flex flex-col px-6 max-w-[25%]">
				<h2 class="text-2xl font-semibold mb-4">Combination Area</h2>
				<div class="mb-4">
					Last Combination: {$lastCombination.element1} + {$lastCombination.element2} = {$lastCombination.result}
				</div>
			</div>
			<ModelSelector />
			<div class="flex">
				<div class="flex items-center space-x-4">
					<div class="flex flex-col">
						<button class="px-4 py-2 rounded bg-indigo-800" on:click={saveServerResponsesToFile}
							>Save Server Responses</button
						>
						<button class="px-4 py-2 rounded bg-indigo-700" on:click={loadServerResponsesFromFile}
							>Load Server Responses</button
						>
						<button class="px-4 py-2 rounded bg-indigo-600" on:click={logServerResponses}
							>Log Server Responses</button
						>
					</div>
					<div class="flex flex-col">
						<button
							on:click={generateRandomCombinations(randomCombinationCount)}
							disabled={isGenerating}
							class="bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded disabled:opacity-50"
						>
							Start Random Generation
						</button>
						<button
							on:click={stopRandomGeneration}
							disabled={!isGenerating}
							class="bg-indigo-300 hover:bg-indigo-300 px-4 py-2 rounded disabled:opacity-50"
						>
							Stop Generation
						</button>
						<input
							type="number"
							bind:value={randomCombinationCount}
							min="1"
							max="100"
							class="bg-gray-700 text-white px-2 py-1 rounded"
						/>
					</div>
				</div>
			</div>
		</div>
		<div
			id="main-area"
			bind:this={mainArea}
			class="bg-gray-800 relative rounded-lg h-full w-full"
			on:dragover={handleDragOver}
			on:drop={handleDrop}
		>
			{#each $dragElements as item (item.id)}
				<div
					use:draggable={{
						bounds: mainArea,
						axis: 'both',
						defaultPosition: { x: item.x, y: item.y }
					}}
					on:neodrag={(e) => handleNeoDrag(e, item.id)}
					on:neodrag:end={(e) => handleNeoDragEnd(e, item.id)}
					on:contextmenu={(e) => removeFromCombinationArea(e, item.id)}
					data-id={item.id}
					class="draggable-element absolute px-4 py-2 rounded-md cursor-move
                        {overlappingPair && overlappingPair.some((el) => el.id === item.id)
						? 'ring-2 ring-yellow-400'
						: ''}
                        {item.isNew ? 'bg-green-600' : 'bg-gray-700'}"
				>
					{item.content}
				</div>
			{/each}
		</div>
	</div>
	{#if contextMenu.show}
		<div
			class="absolute z-50 bg-gray-800 border border-gray-700 rounded shadow-lg"
			style="top: {contextMenu.y}px; left: {contextMenu.x}px;"
		>
			<button
				class="block w-full text-left px-4 py-2 hover:bg-gray-700 transition-colors"
				on:click|stopPropagation={handleDelete}
			>
				Delete
			</button>
		</div>
	{/if}
</div>

<style>
	.draggable-element {
		touch-action: none;
		user-select: none;
	}

	#main-panel {
		display: grid;
		grid-template-rows: 8rem 1fr;
		height: 100%;
	}
</style>
