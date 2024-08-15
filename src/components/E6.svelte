<script>
	import { onMount } from 'svelte';
	import { draggable } from '@neodrag/svelte';
	import {
		elements,
		dragElements,
		lastCombination,
		addDragElement,
		updateDragElement,
		removeDragElement
	} from '$lib/stores.js';
	import { generateCombination } from '$lib/generateCombinations.js';

	let draggedItem = null;
	let mainArea;
	let dragOffset = { x: 0, y: 0 };

	function handleDragStart(event, item) {
		draggedItem = item;
		const rect = event.target.getBoundingClientRect();
		dragOffset.x = event.clientX - rect.left;
		dragOffset.y = event.clientY - rect.top;
		event.dataTransfer.setData('text/plain', JSON.stringify(item));
		event.dataTransfer.effectAllowed = 'move';
		console.log('Drag started:', item, 'Offset:', dragOffset);
	}

	function handleDragOver(event) {
		event.preventDefault();
		event.dataTransfer.dropEffect = 'move';
	}

	function handleDrop(event) {
		event.preventDefault();
		const rect = mainArea.getBoundingClientRect();
		const rawX = event.clientX - rect.left - dragOffset.x;
		const rawY = event.clientY - rect.top - dragOffset.y;

		// Divide by 2 to compensate for the doubling effect
		const x = Math.max(0, Math.min(rawX / 2, rect.width - 100)); // Assuming item width is 100px
		const y = Math.max(0, Math.min(rawY / 2, rect.height - 40)); // Assuming item height is 40px

		console.log('Drop position:', { x, y });

		if (draggedItem) {
			const newItem = { ...draggedItem, id: Date.now(), x, y };
			console.log('Adding new item:', newItem);
			addDragElement(newItem);
			draggedItem = null;
		}
	}

	function handleNeoDrag(event, id) {
		const { x, y } = event.detail;
		console.log('NeoDrag update:', id, { x, y });
		updateDragElement(id, { x, y });
		checkCombinations(id);
	}

	async function checkCombinations(movedItemId) {
		const movedItem = $dragElements.find((item) => item.id === movedItemId);
		for (let item of $dragElements) {
			if (item.id !== movedItemId && isOverlapping(movedItem, item)) {
				const newElement = await generateCombination(movedItem.content, item.content);
				if (newElement) {
					removeDragElement(movedItem.id);
					removeDragElement(item.id);
					addDragElement({ id: Date.now(), content: newElement, x: movedItem.x, y: movedItem.y });
					break;
				}
			}
		}
	}

	function isOverlapping(item1, item2) {
		const buffer = 50; // Adjust this value to change the combining distance
		return Math.abs(item1.x - item2.x) < buffer && Math.abs(item1.y - item2.y) < buffer;
	}

	onMount(() => {
		mainArea = document.getElementById('main-area');
		mainArea.addEventListener('dragover', handleDragOver);
		mainArea.addEventListener('drop', handleDrop);

		return () => {
			mainArea.removeEventListener('dragover', handleDragOver);
			mainArea.removeEventListener('drop', handleDrop);
		};
	});

	$: console.log('Current dragElements:', $dragElements);
</script>

<div class="flex h-screen w-screen bg-gray-900 text-gray-200">
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
	<div class="w-3/4 p-4">
		<h2 class="text-2xl font-semibold mb-4">Combination Area</h2>
		<div class="mb-4">
			Last Combination: {$lastCombination.element1} + {$lastCombination.element2} = {$lastCombination.result}
		</div>
		<div id="main-area" class="graph-vis bg-gray-800 relative rounded-lg h-full p-4">
			{#each $dragElements as item (item.id)}
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
			{/each}
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
