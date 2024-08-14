<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { draggable } from '@neodrag/svelte';
	import type { DragEventData, DragOptions } from '@neodrag/svelte';
	import {
		elements,
		combinations,
		generationStore,
		lastCombinedElements,
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
			const storedElements = localStorage.getItem('elements');
			const storedCombinations = localStorage.getItem('combinations');
			const storedDragElements = localStorage.getItem('comboBoard');

			if (storedElements) elements.set(JSON.parse(storedElements));
			if (storedCombinations) combinations.set(JSON.parse(storedCombinations));
			if (storedDragElements) {
				dragElements = JSON.parse(storedDragElements);
				nextId = Math.max(...dragElements.map((el) => el.id)) + 1;
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
		}
	});

	function addElement(content: string, x: number, y: number) {
		const position = findFreePosition();
		dragElements = [
			...dragElements,
			{
				id: nextId++,
				content,
				x,
				y,
				width: 0,
				height: 0,
				isOverlapping: false,
				isCombining: false,
				isNewCombo: false
			}
		];
		updateElementSizes();
		saveToLocalStorage();
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
		statusMessage = `Combining ${el1.content} and ${el2.content}...`;

		el1.isCombining = true;
		el2.isCombining = true;
		dragElements = [...dragElements];

		const newContent = await generateCombination(el1.content, el2.content);
		const isNewCombo = !$combinations[`${el1.content}+${el2.content}`];

		dragElements = dragElements.filter((el) => el.id !== el1.id && el.id !== el2.id);
		addElement(newContent, el1.x, el1.y);
		dragElements[dragElements.length - 1].isNewCombo = isNewCombo;

		lastCombinedElements.set({ el1: el1.content, el2: el2.content, result: newContent });
		statusMessage = `Created ${newContent} from ${el1.content} and ${el2.content}`;

		setTimeout(() => {
			dragElements = dragElements.map((el) => ({ ...el, isCombining: false, isNewCombo: false }));
		}, 20);
	}

	function isOverlapping(el1, el2) {
		const element1 = document.getElementById(`element-${el1.id}`);
		const element2 = document.getElementById(`element-${el2.id}`);

		if (!element1 || !element2) return false;

		const rect1 = element1.getBoundingClientRect();
		const rect2 = element2.getBoundingClientRect();

		// Adjust for the element's position within its parent
		const parentRect = element1.offsetParent.getBoundingClientRect();

		const adjustedRect1 = {
			left: rect1.left - parentRect.left,
			right: rect1.right - parentRect.left,
			top: rect1.top - parentRect.top,
			bottom: rect1.bottom - parentRect.top
		};

		const adjustedRect2 = {
			left: rect2.left - parentRect.left,
			right: rect2.right - parentRect.left,
			top: rect2.top - parentRect.top,
			bottom: rect2.bottom - parentRect.top
		};

		return !(
			adjustedRect1.right < adjustedRect2.left ||
			adjustedRect1.left > adjustedRect2.right ||
			adjustedRect1.bottom < adjustedRect2.top ||
			adjustedRect1.top > adjustedRect2.bottom
		);
	}

	function handleDrop(event: DragEvent) {
		event.preventDefault();
		const content = event.dataTransfer?.getData('text/plain');
		if (content && graphVisElement) {
			const rect = graphVisElement.getBoundingClientRect();
			const x = event.clientX - rect.left;
			const y = event.clientY - rect.top;

			// Check if the drop position is within the bounds of the graph-vis element
			if (x >= 0 && x <= rect.width && y >= 0 && y <= rect.height) {
				addElement(content, x, y);
			}
		}
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
				checkOverlapAndCombine();
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
		console.log(`🚀 ~ checkOverlapAndCombine ~ droppedElement:`, droppedElement);

		let overlappingElement = null;

		// Reset properties for all elements
		dragElements = dragElements.map((el) => ({
			...el,
			isOverlapping: false,
			isCombining: false,
			isNewCombo: false
		}));

		// Find overlapping element
		for (let i = 0; i < dragElements.length; i++) {
			const currentElement = dragElements[i];
			if (
				currentElement.id !== droppedElement.id &&
				isOverlapping(droppedElement, currentElement)
			) {
				overlappingElement = currentElement;
				break;
			}
		}

		if (overlappingElement) {
			// Set isOverlapping for both elements
			droppedElement.isOverlapping = true;
			overlappingElement.isOverlapping = true;

			// Set isCombining for both elements
			droppedElement.isCombining = true;
			overlappingElement.isCombining = true;

			// Trigger reactivity
			dragElements = [...dragElements];

			// Perform combination
			const newContent = await generateCombination(
				droppedElement.content,
				overlappingElement.content
			);
			const isNewCombo = !$combinations[`${droppedElement.content}+${overlappingElement.content}`];

			// Remove old elements and add new combined element
			dragElements = dragElements.filter(
				(el) => el.id !== droppedElement.id && el.id !== overlappingElement.id
			);
			const newElement = addElement(newContent, droppedElement.x, droppedElement.y);

			// Set isNewCombo for the new element
			newElement ? (newElement.isNewCombo = isNewCombo) : null;

			// Update last combined elements
			lastElement1.set(droppedElement.content);
			lastElement2.set(overlappingElement.content);
			lastResult.set(newContent);

			// Update status message
			statusMessage = `Created ${newContent} from ${droppedElement.content} and ${overlappingElement.content}`;

			// Reset combining state after a short delay
			setTimeout(() => {
				dragElements = dragElements.map((el) => ({
					...el,
					isCombining: false,
					isNewCombo: false
				}));
			}, 2000);
		}

		// Ensure reactivity
		dragElements = [...dragElements];
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
		localStorage.setItem('comboBoard', JSON.stringify(dragElements));
	}

	async function toggleGeneration() {
		if ($generationStore.isGenerating) {
			generationStore.stopGeneration();
		} else {
			generateRandomCombinations(randomGenerationCount);
		}
	}

	function handleDragStart(event, element) {
		event.dataTransfer.setData('text/plain', element);
	}

	function handleDoubleClick(element) {
		addElement(element, 0, 0);
	}
</script>

<div class="flex h-screen bg-gray-900 text-gray-200">
	<!-- Left Sidebar -->
	<div class="w-1/4 p-4 border-r border-gray-700 overflow-y-auto">
		<h2 class="text-2xl font-semibold mb-4">Elements</h2>
		<div class="flex flex-wrap gap-2">
			{#each $elements as element}
				<button
					on:dblclick={() => handleDoubleClick(element)}
					draggable="true"
					on:dragstart={(e) => handleDragStart(e, element)}
					class="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors cursor-move"
				>
					{element}
				</button>
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
				{$lastElement1} + {$lastElement2} = {$lastResult}
			</div>
		</div>
		<div
			class="graph-vis bg-gray-800 rounded-lg h-full p-4 flex items-center justify-center"
			bind:this={graphVisElement}
			on:drop={handleDrop}
			on:dragover={handleDragOver}
		>
			{#each dragElements as element (element.id)}
				<div
					id="element-{element.id}"
					use:draggable={{
						position: { x: element.x, y: element.y },
						bounds: 'parent',
						gpuAcceleration: true,
						onDrag: ({ offsetX, offsetY }) => {
							element.x = offsetX;
							element.y = offsetY;
							checkOverlap(element);
						},
						onDragEnd: () => {
							checkOverlapAndCombine(element);
							// updateElementSizes();
							saveToLocalStorage();
						}
					}}
					on:contextmenu|preventDefault={() => removeElement(element.id)}
					class="draggable-element"
					class:overlapping={element.isOverlapping}
					class:combining={element.isCombining}
					class:new-combo={element.isNewCombo}
					class:existing-combo={element.isCombining && !element.isNewCombo}
					style="transform: translate({element.x}px, {element.y}px)"
				>
					{element.content}
				</div>
			{/each}
		</div>
	</div>
</div>

{#if statusMessage}
	<div class="status-message">{statusMessage}</div>
{/if}

<style>
	.graph-vis {
		position: relative;
		overflow: hidden;
	}

	.draggable-element {
		position: absolute;
		padding: 10px;
		background-color: #2a2a2a;
		border: 1px solid #555;
		border-radius: 5px;
		cursor: move;
		user-select: none;
		color: #fff;
		transition: all 0.1s ease;
	}

	.overlapping {
		box-shadow: 0 0 10px rgba(255, 255, 0, 0.5);
		border-color: yellow;
	}

	.combining {
		animation: pulse 1s infinite;
	}

	.new-combo {
		background-color: #4a4a;
	}

	.existing-combo {
		background-color: #a44a;
	}

	.status-message {
		position: absolute;
		top: 10px;
		left: 50%;
		transform: translateX(-50%);
		background-color: rgba(0, 0, 0, 0.7);
		color: #fff;
		padding: 10px 20px;
		border-radius: 20px;
		font-weight: bold;
		z-index: 1000;
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
