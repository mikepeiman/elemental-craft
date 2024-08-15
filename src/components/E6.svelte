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
		initializeNextId
	} from '$lib/stores.js';
	import {
		generateCombination,
		generateRandomCombinations,
		stopRandomGeneration
	} from '$lib/generateCombinations.js';
	import { tick } from 'svelte';

	let draggedItem = null;
	let mainArea;
	let dragOffset = { x: 0, y: 0 };
	let mounted = false;
	let randomCombinationCount = 10;
	let isGenerating = false;
	let isCombining = false;

	function handleDragStart(event, item) {
		draggedItem = item;
		const rect = event.target.getBoundingClientRect();
		dragOffset.x = event.clientX - rect.left;
		dragOffset.y = event.clientY - rect.top;
		event.dataTransfer.setData('text/plain', JSON.stringify(item));
		event.dataTransfer.effectAllowed = 'move';
	}

	function handleDragOver(event) {
		event.preventDefault();
		event.dataTransfer.dropEffect = 'move';
	}

	async function handleDrop(event) {
		event.preventDefault();
		const rect = mainArea.getBoundingClientRect();
		const rawX = event.clientX - rect.left - dragOffset.x;
		const rawY = event.clientY - rect.top - dragOffset.y;

		const x = Math.max(0, Math.min(rawX / 2, rect.width - 100));
		const y = Math.max(0, Math.min(rawY / 2, rect.height - 40));

		if (draggedItem) {
			const newItem = { ...draggedItem, id: Date.now(), x, y };
			addDragElement(newItem);
			draggedItem = null;
		}
	}

	async function handleNeoDrag(event, id) {
		if (isCombining) return;
		const { x, y } = event.detail;
		updateDragElement(id, { x, y });
		const movedItem = $dragElements.find((item) => item.id === id);
		await checkCombinations(movedItem);
	}

	async function checkCombinations(movedItem) {
		if (isCombining) return;
		isCombining = true;

		for (let item of $dragElements) {
			if (item.id !== movedItem.id && isOverlapping(movedItem, item)) {
				const [element1, element2] = [movedItem.content, item.content].sort();
				const combinationKey = `${element1},${element2}`;

				let newElement;
				if ($combinations[combinationKey]) {
					newElement = $combinations[combinationKey];
				} else {
					newElement = await generateCombination(element1, element2);
				}

				if (newElement) {
					removeDragElement(movedItem.id);
					removeDragElement(item.id);
					const newId = Date.now();
					addDragElement({
						id: newId,
						content: newElement,
						x: (movedItem.x + item.x) / 2,
						y: (movedItem.y + item.y) / 2
					});
					break;
				}
			}
		}

		isCombining = false;
	}

	function isOverlapping(item1, item2) {
		const buffer = 50;
		return Math.abs(item1.x - item2.x) < buffer && Math.abs(item1.y - item2.y) < buffer;
	}

	async function startRandomGeneration() {
		isGenerating = true;
		await generateRandomCombinations(randomCombinationCount);
		isGenerating = false;
	}

	function stopRandomGenerationHandler() {
		stopRandomGeneration();
		isGenerating = false;
	}

	onMount(async () => {
		mainArea = document.getElementById('main-area');
		mainArea.addEventListener('dragover', handleDragOver);
		mainArea.addEventListener('drop', handleDrop);

		initializeNextId($dragElements);

		await tick();
		mounted = true;

		return () => {
			mainArea.removeEventListener('dragover', handleDragOver);
			mainArea.removeEventListener('drop', handleDrop);
		};
	});

	$: if (mounted) {
		dragElements.update((els) => els.map((el) => ({ ...el, x: el.x || 0, y: el.y || 0 })));
	}
</script>

<div class="flex flex-col h-screen w-screen bg-gray-900 text-gray-200">
	<div class="p-4 bg-gray-800">
		<h1 class="text-2xl font-bold mb-4">Element Combination Game</h1>
		<div class="flex items-center space-x-4">
			<input
				type="number"
				bind:value={randomCombinationCount}
				min="1"
				max="100"
				class="bg-gray-700 text-white px-2 py-1 rounded"
			/>
			<button
				on:click={startRandomGeneration}
				disabled={isGenerating}
				class="bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded disabled:opacity-50"
			>
				Start Random Generation
			</button>
			<button
				on:click={stopRandomGenerationHandler}
				disabled={!isGenerating}
				class="bg-red-500 hover:bg-red-600 px-4 py-2 rounded disabled:opacity-50"
			>
				Stop Generation
			</button>
		</div>
	</div>

	<div class="flex flex-1 overflow-hidden">
		<!-- Left Sidebar -->
		<div class="w-1/4 p-4 border-r border-gray-700 overflow-y-auto">
			<h2 class="text-2xl font-semibold mb-4">Elements</h2>
			<div class="flex flex-wrap gap-2">
				{#each $elements as item (item.id)}
					<div
						draggable="true"
						on:dragstart={(e) => handleDragStart(e, item)}
						class="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors cursor-move"
					>
						{item.content}
					</div>
				{/each}
			</div>
		</div>

		<!-- Central Graph View -->
		<div class="w-3/4 p-4 overflow-hidden">
			<h2 class="text-2xl font-semibold mb-4">Combination Area</h2>
			<div class="mb-4">
				Last Combination: {$lastCombination.element1} + {$lastCombination.element2} = {$lastCombination.result}
			</div>
			<div id="main-area" class="graph-vis bg-gray-800 relative rounded-lg h-full p-4">
				{#each $dragElements as item (item.id)}
					{#if mounted && item.id !== undefined}
						<div
							use:draggable={{
								bounds: 'parent',
								defaultPosition: { x: item.x, y: item.y }
							}}
							on:neodrag={(e) => handleNeoDrag(e, item.id)}
							style="position: absolute; left: {item.x}px; top: {item.y}px;"
							class="draggable-element px-4 py-2 bg-gray-700 text-white rounded-md cursor-move"
						>
							{item.content}
						</div>
					{/if}
				{/each}
			</div>
		</div>
	</div>
</div>

<style>
	.graph-vis {
		position: relative;
		overflow: hidden;
	}

	.draggable-element {
		transition: none;
	}
</style>
