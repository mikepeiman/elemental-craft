<script>
	import { onMount } from 'svelte';
	import { elements, dragElements, lastCombination, combinations } from '$lib/stores.js';
	import { generateCombination } from '$lib/generateCombinations.js';

	let mainArea;
	let draggedElement = null;
	let overlappingPair = null;

	function handleDragStart(event, element) {
		draggedElement = element;
		event.dataTransfer.setData('text/plain', JSON.stringify(element));
	}

	function handleDragOver(event) {
		event.preventDefault();
		const draggedOver = getDraggedOverElement(event.clientX, event.clientY);

		if (draggedOver && draggedOver !== draggedElement) {
			overlappingPair = [draggedElement, draggedOver];
		} else {
			overlappingPair = null;
		}
	}

	function handleDrop(event) {
		event.preventDefault();
		const x = event.clientX - mainArea.offsetLeft;
		const y = event.clientY - mainArea.offsetTop;

		if (draggedElement) {
			if (overlappingPair) {
				combineElements(overlappingPair[0], overlappingPair[1], x, y);
			} else {
				addElement(draggedElement, x, y);
			}
		}

		draggedElement = null;
		overlappingPair = null;
	}

	function handleDragEnd() {
		draggedElement = null;
		overlappingPair = null;
	}

	function getDraggedOverElement(x, y) {
		const elements = document.elementsFromPoint(x, y);
		for (let el of elements) {
			if (el.classList.contains('draggable-element')) {
				const id = parseInt(el.dataset.id);
				return $dragElements.find((item) => item.id === id);
			}
		}
		return null;
	}

	async function combineElements(element1, element2, x, y) {
		const [smallerEl, largerEl] = [element1.content, element2.content].sort();
		const combinationKey = `${smallerEl},${largerEl}`;

		let newElement;
		if ($combinations[combinationKey]) {
			newElement = $combinations[combinationKey];
		} else {
			newElement = await generateCombination(smallerEl, largerEl);
		}

		if (newElement) {
			dragElements.update((els) =>
				els
					.filter((el) => el.id !== element1.id && el.id !== element2.id)
					.concat([{ id: Date.now(), content: newElement, x, y, isNew: true }])
			);
			lastCombination.set({ element1: smallerEl, element2: largerEl, result: newElement });
		}
	}

	function addElement(element, x, y) {
		dragElements.update((els) => [
			...els,
			{ id: Date.now(), content: element.content, x, y, isNew: false }
		]);
	}

	onMount(() => {
		mainArea = document.getElementById('main-area');
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
					draggable="true"
					on:dragstart={(e) => handleDragStart(e, item)}
					on:dragend={handleDragEnd}
					data-id={item.id}
					style="position: absolute; left: {item.x}px; top: {item.y}px;"
					class="draggable-element px-4 py-2 rounded-md cursor-move
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
		transition: none;
		user-select: none;
	}
</style>
