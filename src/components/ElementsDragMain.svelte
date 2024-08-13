<script lang="ts">
	import { onMount } from 'svelte';
	import { draggable } from '@neodrag/svelte';
	import type { DragEventData } from '@neodrag/svelte';
	import { generateCombination } from '$lib/generateCombinations.js';

	export let elements: string[];

	let dragElements: { id: number; content: string; x: number; y: number }[] = [];
	let nextId = 1;

	function addElement(content: string) {
		dragElements = [...dragElements, { id: nextId++, content, x: 0, y: 0 }];
	}

	function removeElement(id: number) {
		dragElements = dragElements.filter((el) => el.id !== id);
	}

	async function combineElements(id1: number, id2: number) {
		const el1 = dragElements.find((el) => el.id === id1);
		const el2 = dragElements.find((el) => el.id === id2);
		if (el1 && el2) {
			const newContent = await generateCombination(el1.content, el2.content);
			dragElements = dragElements.filter((el) => el.id !== id1 && el.id !== id2);
			dragElements = [...dragElements, { id: nextId++, content: newContent, x: el1.x, y: el1.y }];
		}
	}

	function handleDrag(id: number, event: CustomEvent<DragEventData>) {
		const { offsetX, offsetY } = event.detail;
		dragElements = dragElements.map((el) =>
			el.id === id ? { ...el, x: offsetX, y: offsetY } : el
		);
	}

	function checkOverlap() {
		for (let i = 0; i < dragElements.length; i++) {
			for (let j = i + 1; j < dragElements.length; j++) {
				const el1 = dragElements[i];
				const el2 = dragElements[j];
				if (Math.abs(el1.x - el2.x) < 50 && Math.abs(el1.y - el2.y) < 50) {
					setTimeout(() => combineElements(el1.id, el2.id), 50);
					return;
				}
			}
		}
	}

	function handleDrop(event: DragEvent) {
		event.preventDefault();
		const content = event.dataTransfer?.getData('text/plain');
		if (content) {
			const rect = event.currentTarget.getBoundingClientRect();
			const x = event.clientX - rect.left;
			const y = event.clientY - rect.top;
			dragElements = [...dragElements, { id: nextId++, content, x, y }];
		}
	}

	function handleDragOver(event: DragEvent) {
		event.preventDefault();
	}
</script>

<div class="graph-vis" on:drop={handleDrop} on:dragover={handleDragOver}>
	{#each dragElements as element (element.id)}
		<div
			use:draggable={{
				position: { x: element.x, y: element.y },
				bounds: 'parent',
				onDrag: (e) => handleDrag(element.id, { detail: e }),
				onDragEnd: checkOverlap
			}}
			on:contextmenu|preventDefault={() => removeElement(element.id)}
			class="draggable-element"
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
</style>
