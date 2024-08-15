<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { draggable } from '@neodrag/svelte';
	import type { DragEventData, DragOptions } from '@neodrag/svelte';
	import {
		elements,
		combinations,
		generationStore,
		lastElement1,
		lastElement2,
		lastResult
	} from '$lib/stores.js';
	import { generateCombination, generateRandomCombinations } from '$lib/generateCombinations.js';

	let selectedElements = [];
	let result = '';
	let randomGenerationCount = 10;
	let statusMessage = '';
	let graphVisElement: HTMLElement;

	$: console.log(
		`🚀 ~ lastElement1, lastElement2, lastResult:`,
		$lastElement1,
		$lastElement2,
		$lastResult
	);

	let dragElements: {
		id: number;
		content: string;
		parents: string[];
		x: number;
		y: number;
		width: number;
		height: number;
		isOverlapping: boolean;
		isCombining: boolean;
		isNewCombo: boolean;
	}[] = [];
	let nextId = 1;

	const ELEMENT_PADDING = 10;
	const ELEMENT_MARGIN = 5;
	const ELEMENT_HEIGHT = 40;

	onMount(() => {
		if (browser) {
			try {
				const storedElements = localStorage.getItem('elements');
				const storedCombinations = localStorage.getItem('combinations');
				const storedDragElements = localStorage.getItem('comboBoard');

				if (storedElements) elements.set(JSON.parse(storedElements));
				if (storedCombinations) combinations.set(JSON.parse(storedCombinations));
				if (storedDragElements) {
					dragElements = JSON.parse(storedDragElements);
					nextId = Math.max(...dragElements.map((el) => el.id), 0) + 1;
				}

				updateElementSizes();

				const unsubscribeElements = elements.subscribe((value) => {
					localStorage.setItem('elements', JSON.stringify(value));
				});

				const unsubscribeCombinations = combinations.subscribe((value) => {
					localStorage.setItem('combinations', JSON.stringify(value));
				});

				return () => {
					unsubscribeElements();
					unsubscribeCombinations();
				};
			} catch (error) {
				console.error('Error loading data from localStorage:', error);
			}
		}
	});

	function addElement(content, x, y) {
		const newElement = {
			id: nextId++,
			content,
			x,
			y,
			width: 0,
			height: 0,
			isOverlapping: false,
			isCombining: false,
			isNewCombo: false,
			parents: []
		};
		dragElements = [...dragElements, newElement];
		updateElementSizes();
		saveToLocalStorage();
		return newElement;
	}

	function findFreePosition() {
		const containerWidth = graphVisElement?.clientWidth || 500;
		const containerHeight = graphVisElement?.clientHeight || 500;
		const rowHeight = ELEMENT_HEIGHT + ELEMENT_PADDING * 2 + ELEMENT_MARGIN;
		const maxRows = Math.floor(containerHeight / rowHeight);

		for (let attempt = 0; attempt < 100; attempt++) {
			const row = Math.floor(Math.random() * maxRows);
			const x = Math.random() * (containerWidth - 100);
			const y = row * rowHeight;

			if (!isPositionOccupied(x, y)) {
				return { x, y };
			}
		}

		return {
			x: Math.random() * (containerWidth - 100),
			y: Math.random() * (containerHeight - ELEMENT_HEIGHT)
		};
	}

	function isPositionOccupied(x: number, y: number) {
		return dragElements.some(
			(el) =>
				x < el.x + el.width + ELEMENT_PADDING * 2 + ELEMENT_MARGIN &&
				x + 100 > el.x - ELEMENT_PADDING - ELEMENT_MARGIN &&
				y < el.y + el.height + ELEMENT_PADDING * 2 + ELEMENT_MARGIN &&
				y + ELEMENT_HEIGHT > el.y - ELEMENT_PADDING - ELEMENT_MARGIN
		);
	}

	function removeElement(id: number) {
		dragElements = dragElements.filter((el) => el.id !== id);
		saveToLocalStorage();
	}

	async function combineElements(el1, el2) {
		try {
			statusMessage = `Combining ${el1.content} and ${el2.content}...`;

			el1.isCombining = true;
			el2.isCombining = true;
			dragElements = [...dragElements];

			const newContent = await generateCombination(el1.content, el2.content);
			const isNewCombo = !$combinations[`${el1.content}+${el2.content}`];

			dragElements = dragElements.filter((el) => el.id !== el1.id && el.id !== el2.id);
			const newElement = addElement(newContent, el1.x, el1.y);
			newElement.isNewCombo = isNewCombo;

			statusMessage = `Created ${newContent} from ${el1.content} and ${el2.content}`;

			setTimeout(() => {
				dragElements = dragElements.map((el) => ({ ...el, isCombining: false, isNewCombo: false }));
			}, 20);
		} catch (error) {
			console.error('Error combining elements:', error);
			statusMessage = 'Error combining elements';
		}
	}

	function isOverlapping(el1, el2) {
		return (
			el1.x < el2.x + el2.width &&
			el1.x + el1.width > el2.x &&
			el1.y < el2.y + el2.height &&
			el1.y + el1.height > el2.y
		);
	}

	function handleDragOver(event: DragEvent) {
		event.preventDefault();
	}

	function getDragOptions(element): DragOptions {
		return {
			position: { x: element.x, y: element.y },
			bounds: 'parent',
			gpuAcceleration: true,
			onDrag: ({ offsetX, offsetY }: DragEventData) => {
				element.x = offsetX;
				element.y = offsetY;
				checkOverlap(element);
			},
			onDragEnd: () => {
				checkOverlapAndCombine(element);
				updateElementSizes();
				saveToLocalStorage();
			}
		};
	}

	function checkOverlap(currentElement) {
		dragElements.forEach((element) => {
			if (element.id !== currentElement.id) {
				element.isOverlapping = isOverlapping(currentElement, element);
			}
		});
		dragElements = [...dragElements]; // Trigger reactivity
	}

	async function checkOverlapAndCombine(droppedElement) {
		try {
			let overlappingElement = dragElements.find(
				(el) => el.id !== droppedElement.id && isOverlapping(droppedElement, el)
			);

			if (overlappingElement) {
				droppedElement.isOverlapping = true;
				overlappingElement.isOverlapping = true;
				droppedElement.isCombining = true;
				overlappingElement.isCombining = true;

				dragElements = [...dragElements];

				const newContent = await generateCombination(
					droppedElement.content,
					overlappingElement.content
				);
				const isNewCombo =
					!$combinations[`${droppedElement.content}+${overlappingElement.content}`];

				dragElements = dragElements.filter(
					(el) => el.id !== droppedElement.id && el.id !== overlappingElement.id
				);
				const newElement = addElement(newContent, droppedElement.x, droppedElement.y);
				newElement.isNewCombo = isNewCombo;

				lastElement1.set(droppedElement.content);
				lastElement2.set(overlappingElement.content);
				lastResult.set(newContent);

				statusMessage = `Created ${newContent} from ${droppedElement.content} and ${overlappingElement.content}`;

				setTimeout(() => {
					dragElements = dragElements.map((el) => ({
						...el,
						isCombining: false,
						isNewCombo: false
					}));
				}, 200);
			}

			dragElements = [...dragElements];
		} catch (error) {
			console.error('Error in checkOverlapAndCombine:', error);
			statusMessage = 'Error combining elements';
		}
	}

	function updateElementSizes() {
		dragElements = dragElements.map((el) => {
			const element = document.getElementById(`element-${el.id}`);
			if (element) {
				const rect = element.getBoundingClientRect();
				return { ...el, width: rect.width, height: rect.height };
			}
			return el;
		});
	}

	function saveToLocalStorage() {
		try {
			localStorage.setItem('comboBoard', JSON.stringify(dragElements));
		} catch (error) {
			console.error('Error saving to localStorage:', error);
		}
	}

	async function toggleGeneration() {
		if ($generationStore.isGenerating) {
			generationStore.stopGeneration();
		} else {
			generateRandomCombinations(randomGenerationCount);
		}
	}

	function handleElementDrop(event: DragEvent) {
		event.preventDefault();
		const content = event.dataTransfer.getData('text/plain');
		if (content && graphVisElement) {
			const rect = graphVisElement.getBoundingClientRect();
			const x = event.clientX - rect.left;
			const y = event.clientY - rect.top;
			addElement(content, x, y);
		}
	}

	function startElementDrag(event: DragEvent, element) {
		event.dataTransfer.setData('text/plain', element.content);
	}
</script>

<div class="flex h-screen w-screen bg-gray-900 text-gray-200">
	<!-- Left Sidebar -->
	<div class="w-1/4 p-4 border-r border-gray-700 overflow-y-auto">
		<h2 class="text-2xl font-semibold mb-4">Elements</h2>
		<div class="flex flex-wrap gap-2">
			{#each $elements as element}
				<div
					draggable="true"
					style="left: {element.x}px; top: {element.y}px;"
					on:dragstart={(e) => startElementDrag(e, element)}
					class="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors cursor-move"
				>
					{element.content}
				</div>
			{/each}
		</div>

		<div class="mt-8">
			<h2 class="text-2xl font-semibold mb-4">Random Generation</h2>
			<div class="flex items-center gap-4">
				<input
					type="number"
					bind:value={randomGenerationCount}
					min="1"
					max="1000"
					class="px-4 py-2 border border-gray-700 rounded-md w-24 bg-gray-800 text-white"
				/>
				<button
					on:click={toggleGeneration}
					class="px-6 py-2 bg-lime-700 text-white rounded-md hover:bg-lime-600 transition-colors"
				>
					{$generationStore.isGenerating ? 'Stop Generation' : 'Start Random Generation'}
				</button>
			</div>
		</div>

		<div class="mt-8 bg-gray-800 p-4 rounded-lg">
			<h3 class="text-xl font-semibold mb-4">Generation Status</h3>
			<p class="mb-2">
				Status:
				<span class={$generationStore.isGenerating ? 'text-lime-600' : 'text-red-600'}>
					{$generationStore.isGenerating ? 'Generating combinations...' : 'Generation stopped'}
				</span>
			</p>
			<p class="mb-2">Total elements: <span class="font-medium">{$elements.length}</span></p>
			<p>
				Total combinations: <span class="font-medium">{Object.keys($combinations).length}</span>
			</p>
		</div>
	</div>

	<!-- Central Graph View -->
	<div class="w-3/4 p-4">
		<div class="flex items-center justify-apart align-middle">
			<h2 class="text-2xl font-semibold mb-4">Last Combination</h2>
			<div class="bg-gray-800 rounded-lg h-full p-4">
				{$lastElement1.content} + {$lastElement2.content} = {$lastResult.content}
			</div>
		</div>
		<div
			class="graph-vis bg-gray-800 relative rounded-lg h-full p-4 flex items-center justify-center"
			bind:this={graphVisElement}
			on:dragover={handleDragOver}
			on:drop={handleElementDrop}
		>
			{#each dragElements as element (element.id)}
				<div
					id="element-{element.id}"
					use:draggable={getDragOptions(element)}
					on:contextmenu|preventDefault={() => removeElement(element.id)}
					class="draggable-element"
					class:overlapping={element.isOverlapping}
					class:combining={element.isCombining}
					class:new-combo={element.isNewCombo}
					class:existing-combo={element.isCombining && !element.isNewCombo}
					style="left: {element.x}px; top: {element.y}px;"
				>
					{element.content}
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

	.overlapping {
		border: 2px solid yellow;
	}

	.combining {
		border: 2px solid green;
		animation: pulse 1s infinite;
	}

	@keyframes pulse {
		0% {
			box-shadow: 0 0 0 0 rgba(0, 255, 0, 0.7);
		}
		70% {
			box-shadow: 0 0 0 10px rgba(0, 255, 0, 0);
		}
		100% {
			box-shadow: 0 0 0 0 rgba(0, 255, 0, 0);
		}
	}
</style>
