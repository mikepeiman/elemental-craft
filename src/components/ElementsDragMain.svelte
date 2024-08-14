<script lang="ts">
	import { onMount } from 'svelte';
	import { draggable } from '@neodrag/svelte';
	import type { DragEventData, DragOptions } from '@neodrag/svelte';
	import { generateCombination } from '$lib/generateCombinations.js';

	export let elements: string[];

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
	let graphVisElement: HTMLElement;

	const ELEMENT_PADDING = 10;
	const ELEMENT_MARGIN = 5;
	const ELEMENT_HEIGHT = 40;

	function addElement(content: string, x: number, y: number) {
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

		dragElements = dragElements.filter((el) => el.id !== el1.id && el.id !== el2.id);
		addElement(newContent, el1.x, el1.y);

		lastCombinedElements.set({ el1: el1.content, el2: el2.content, result: newContent });
		statusMessage = `Created ${newContent} from ${el1.content} and ${el2.content}`;
	}

	function checkOverlapAndCombine() {
		let overlappingPairs = [];
		dragElements.forEach((el) => {
			el.isOverlapping = false;
			el.isCombining = false;
		});

		for (let i = 0; i < dragElements.length; i++) {
			for (let j = i + 1; j < dragElements.length; j++) {
				const el1 = dragElements[i];
				const el2 = dragElements[j];
				if (isOverlapping(el1, el2)) {
					overlappingPairs.push([el1, el2]);
					el1.isOverlapping = true;
					el2.isOverlapping = true;
				}
			}
		}

		if (overlappingPairs.length > 0) {
			const [el1, el2] = overlappingPairs[0];
			combineElements(el1, el2);
		}

		dragElements = [...dragElements]; // Trigger reactivity
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

	function handleDrop(event: DragEvent) {
		event.preventDefault();
		const content = event.dataTransfer?.getData('text/plain');
		if (content) {
			const rect = graphVisElement.getBoundingClientRect();
			const x = event.clientX - rect.left;
			const y = event.clientY - rect.top;
			addElement(content, x, y);
		}
	}

	function handleDragOver(event: DragEvent) {
		event.preventDefault();
	}

	function getDragOptions(element): DragOptions {
		console.log(`🚀 ~ getDragOptions ~ element:`, element);
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

	onMount(() => {
		updateElementSizes();
		loadFromLocalStorage();
	});
</script>

<div
	class="graph-vis"
	bind:this={graphVisElement}
	on:drop={handleDrop}
	on:dragover={handleDragOver}
>
	{#each dragElements as element (element.id)}
		<div
			id="element-{element.id}"
			use:draggable={getDragOptions(element)}
			on:contextmenu|preventDefault={() => removeElement(element.id)}
			class="draggable-element"
			class:overlapping={element.isOverlapping}
			style="transform: translate({element.x}px, {element.y}px)"
		>
			{element.content}
		</div>
	{/each}
</div>

{#if statusMessage}
	<div class="status-message">{statusMessage}</div>
{/if}

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
		color: #fff;
		transition:
			box-shadow 0.3s ease,
			border-color 0.3s ease;
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
