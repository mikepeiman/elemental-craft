<script lang="ts">
	import { onMount, createEventDispatcher } from 'svelte';
	import { draggable } from '@neodrag/svelte';
	import type { DragEventData } from '@neodrag/svelte';
	import { generateCombination } from '$lib/generateCombinations.js';
	import { fade } from 'svelte/transition';
	import { lastCombinedElements } from '$lib/stores.js';

	export let elements: string[];

	const dispatch = createEventDispatcher();

	let dragElements: {
		id: number;
		content: string;
		x: number;
		y: number;
		width: number;
		height: number;
		isOverlapping: boolean;
		isCombining: boolean;
	}[] = [];
	let nextId = 1;
	let statusMessage = '';
	$: ({ lastElement1, lastElement2, lastResult } = $lastCombinedElements);

	let lastResult = '';

	const ELEMENT_PADDING = 10;
	const ELEMENT_MARGIN = 5;
	const ELEMENT_HEIGHT = 40; // Approximate height of an element

	export function addElement(content: string, x: number, y: number) {
		const position = findFreePosition();
		dragElements = [
			...dragElements,
			{
				id: nextId++,
				content,
				x: position.x,
				y: position.y,
				width: 0,
				height: 0,
				isOverlapping: false,
				isCombining: false
			}
		];
		checkOverlap();
		handleDragEnd();
		updateElementSizes();
		saveToLocalStorage();
	}

	function findFreePosition() {
		const containerWidth = document.querySelector('.graph-vis').clientWidth;
		const containerHeight = document.querySelector('.graph-vis').clientHeight;
		const rowHeight = ELEMENT_HEIGHT + ELEMENT_PADDING * 2 + ELEMENT_MARGIN;
		const maxRows = Math.floor(containerHeight / rowHeight);

		for (let attempt = 0; attempt < 100; attempt++) {
			const row = Math.floor(Math.random() * maxRows);
			const x = Math.random() * (containerWidth - 100); // 100 is an approximation of element width
			const y = row * rowHeight;

			if (!isPositionOccupied(x, y)) {
				return { x, y };
			}
		}

		// If we couldn't find a free position, return a random position
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

	async function combineElements(id1: number, id2: number) {
		const el1 = dragElements.find((el) => el.id === id1);
		const el2 = dragElements.find((el) => el.id === id2);
		if (el1 && el2) {
			el1.isCombining = true;
			el2.isCombining = true;
			dragElements = [...dragElements];

			// lastCombinedElements = { el1: el1.content, el2: el2.content };
			statusMessage = `Combining ${el1.content} and ${el2.content}...`;

			const newContent = await generateCombination(el1.content, el2.content);
			dragElements = dragElements.filter((el) => el.id !== id1 && el.id !== id2);
			dragElements = [
				...dragElements,
				{
					id: nextId++,
					content: newContent,
					x: el1.x,
					y: el1.y,
					width: 0,
					height: 0,
					isOverlapping: false,
					isCombining: false
				}
			];

			lastResult = newContent;
			statusMessage = `Created ${newContent} from ${el1.content} and ${el2.content}`;
			saveToLocalStorage();
		}
	}

	function handleDrag(id: number, event: CustomEvent<DragEventData>) {
		const { offsetX, offsetY } = event.detail;
		dragElements = dragElements.map((el) =>
			el.id === id ? { ...el, x: offsetX, y: offsetY } : el
		);
		checkOverlap();
	}

	function checkOverlap() {
		for (let i = 0; i < dragElements.length; i++) {
			dragElements[i].isOverlapping = false;
			for (let j = 0; j < dragElements.length; j++) {
				if (i !== j) {
					const el1 = dragElements[i];
					const el2 = dragElements[j];
					if (isOverlapping(el1, el2)) {
						el1.isOverlapping = true;
						el2.isOverlapping = true;
					}
				}
			}
		}
		dragElements = [...dragElements];
	}

	function isOverlapping(el1, el2) {
		const rect1 = {
			left: el1.x - ELEMENT_PADDING,
			right: el1.x + el1.width + ELEMENT_PADDING,
			top: el1.y - ELEMENT_PADDING,
			bottom: el1.y + el1.height + ELEMENT_PADDING
		};
		const rect2 = {
			left: el2.x - ELEMENT_PADDING,
			right: el2.x + el2.width + ELEMENT_PADDING,
			top: el2.y - ELEMENT_PADDING,
			bottom: el2.y + el2.height + ELEMENT_PADDING
		};

		return !(
			rect1.right < rect2.left ||
			rect1.left > rect2.right ||
			rect1.bottom < rect2.top ||
			rect1.top > rect2.bottom
		);
	}

	function handleDragEnd() {
		for (let i = 0; i < dragElements.length; i++) {
			for (let j = i + 1; j < dragElements.length; j++) {
				const el1 = dragElements[i];
				const el2 = dragElements[j];
				if (isOverlapping(el1, el2)) {
					setTimeout(() => combineElements(el1.id, el2.id), 50);
					return;
				}
			}
		}
		saveToLocalStorage();
	}

	function handleDrop(event: DragEvent) {
		event.preventDefault();
		const content = event.dataTransfer?.getData('text/plain');
		if (content) {
			const rect = event.currentTarget.getBoundingClientRect();
			const x = event.clientX - rect.left;
			const y = event.clientY - rect.top;
			addElement(content, x, y);
		}
	}

	function handleDragOver(event: DragEvent) {
		event.preventDefault();
	}

	onMount(() => {
		updateElementSizes();
		loadFromLocalStorage();
	});

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

	function loadFromLocalStorage() {
		const savedData = localStorage.getItem('comboBoard');
		if (savedData) {
			dragElements = JSON.parse(savedData);
			nextId = Math.max(...dragElements.map((el) => el.id)) + 1;
		}
	}
</script>

<!-- <div class="status-message" transition:fade>
	{#if statusMessage}
		<p>{statusMessage}</p>
	{/if}
	{#if lastCombinedElements.el1 && lastCombinedElements.el2}
		<p>Last combined: {lastCombinedElements.el1} + {lastCombinedElements.el2}</p>
	{/if}
	{#if lastResult}
		<p>Result: {lastResult}</p>
	{/if}
</div> -->

<div class="graph-vis" on:drop={handleDrop} on:dragover={handleDragOver}>
	{#each dragElements as element (element.id)}
		<div
			id="element-{element.id}"
			use:draggable={{
				position: { x: element.x, y: element.y },
				bounds: 'parent',
				onDrag: (e) => handleDrag(element.id, { detail: e }),
				onDragEnd: () => {
					handleDragEnd();
					updateElementSizes();
				},
				defaultPosition: { x: element.x, y: element.y },
				grid: [1, 1]
			}}
			on:contextmenu|preventDefault={() => removeElement(element.id)}
			class="draggable-element"
			class:overlapping={element.isOverlapping}
			class:combining={element.isCombining}
			style="left: {element.x}px; top: {element.y}px;"
		>
			{element.content}
		</div>
	{/each}
</div>

<style>
	.graph-vis {
		width: 100%;
		height: 100%;
		border: 1px solid #ccc;
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
		transition: all 0.3s ease;
		color: #fff;
	}

	.overlapping {
		box-shadow: 0 0 10px rgba(255, 255, 0, 0.5);
		border-color: yellow;
	}

	.combining {
		animation: pulse 1s infinite;
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
