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
		updateLastCombination
	} from '$lib/stores.js';
	import { generateCombination } from '$lib/generateCombinations.js';

	let mainArea;
	let draggedElement = null;
	let overlappingPair = null;
	let dragOffset = { x: 0, y: 0 };
	let combiningElements = null;
	function handleDragStart(event, element) {
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
		event.preventDefault();
		const x = event.clientX - mainArea.offsetLeft - dragOffset.x;
		const y = event.clientY - mainArea.offsetTop - dragOffset.y;

		if (draggedElement) {
			addDragElement({ ...draggedElement, x, y });
		}

		draggedElement = null;
		overlappingPair = null;
	}

	function handleNeoDrag(event, id) {
		const { x, y } = event.detail;
		updateDragElement(id, { x, y });
		checkOverlap(id, x, y);
	}

	function checkOverlap(id) {
		const currentElement = document.querySelector(`[data-id="${id}"]`);
		if (!currentElement) return;

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
				return;
			}
		}
	}

	function isOverlapping(rect1, rect2) {
		return !(
			rect1.right < rect2.left ||
			rect1.left > rect2.right ||
			rect1.bottom < rect2.top ||
			rect1.top > rect2.bottom
		);
	}

	async function handleNeoDragEnd(event, id) {
		const { x, y } = event.detail;
		console.log(`🚀 ~ handleNeoDragEnd ~ x, y:`, x, y);
		updateDragElement(id, { x, y });
		checkOverlap(id, x, y);

		if (overlappingPair) {
			const [element1, element2] = overlappingPair;
			await combineElements(element1, element2, x, y);
		}
		overlappingPair = null;
	}

	async function combineElements(element1, element2, x, y) {
		const [smallerEl, largerEl] = [element1.content, element2.content].sort();
		const combinationKey = `${smallerEl},${largerEl}`;

		let newElement;
		if ($combinations[combinationKey]) {
			newElement = $combinations[combinationKey];
		} else {
			newElement = await generateCombination(smallerEl, largerEl);
			if (newElement) {
				combinations.update((c) => ({ ...c, [combinationKey]: newElement }));
			}
		}

		if (newElement) {
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
		}
	}

	function handleContextMenu(event, id) {
		event.preventDefault();
		removeDragElement(id);
	}

	onMount(() => {
		mainArea = document.getElementById('main-area');
		initializeNextId($dragElements);
	});
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
		<div
			id="main-area"
			class="bg-gray-800 relative rounded-lg h-[calc(100%-4rem)] w-full"
			on:dragover={handleDragOver}
			on:drop={handleDrop}
		>
			{#each $dragElements as item (item.id)}
				<div
					use:draggable={{
						bounds: 'parent',
						axis: 'both',
						defaultPosition: { x: item.x, y: item.y }
					}}
					on:neodrag={(e) => handleNeoDrag(e, item.id)}
					on:neodragend={(e) => handleNeoDragEnd(e, item.id)}
					on:contextmenu={(e) => handleContextMenu(e, item.id)}
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
</div>

<style>
	.draggable-element {
		touch-action: none;
		user-select: none;
	}
</style>
