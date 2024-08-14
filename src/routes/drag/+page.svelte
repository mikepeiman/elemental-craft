<script lang="ts">
	import { browser } from '$app/environment';
	import { draggable } from '@neodrag/svelte';
	import type { DragEventData, DragOptions } from '@neodrag/svelte';
	import { elements, lastElement1, lastElement2, lastResult } from '$lib/stores.js';
	import { onMount } from 'svelte';

	let dragArea: HTMLDivElement;
	let dragRect: DOMRect;
	let dragBounds: Object;
	let currentElement: HTMLDivElement;
	$: console.log(`🚀 ~ dragBounds:`, dragRect);
	$: dragArea;
	$: console.log(`🚀 ~ dragArea:`, dragArea);

	onMount(() => {
		dragRect = dragArea.getBoundingClientRect();
		console.log(`🚀 ~ onMount ~ dragBounds:`, dragRect);
		dragBounds = {
			left: dragRect.left,
			right: dragRect.right,
			top: dragRect.top,
			bottom: dragRect.bottom
		};
	});

	function startElementDrag(e: DragEventData, element, domEl) {
		console.log(`🚀 ~ startElementDrag ~ domEl:`, domEl);
		console.log(`🚀 ~ startElementDrag ~ element:`, element);
		console.log('Dragging started', e);
		let clone = e.target.cloneNode(true);
		let elRect = e.target.getBoundingClientRect();
		clone.dataset.original = 'false';
		clone.dataset.clone = 'true';
		clone.style.position = 'absolute';
		clone.style.left = e.detail.x + 'px';
		clone.style.top = e.detail.y + 'px';
		e.target.appendChild(clone);
	}
</script>

<div class="flex h-screen bg-gray-900 text-gray-200">
	<!-- Left Sidebar -->
	<div class="w-1/4 p-4 border-r border-gray-700 overflow-y-auto">
		<h2 class="text-2xl font-semibold mb-4">Elements</h2>
		{#each $elements as element}
			<div
				id="element-{element.id}"
				use:draggable
				on:neodrag:start={(e) => startElementDrag(e, element)}
				on:neodrag={(e) => {
					return null;
				}}
				on:neodrag:end={(e) => console.log('Dragging stopped', e)}
				data-original="true"
				class="px-4 py-2 z-10 relative bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors cursor-move"
			>
				{element.content}
			</div>
		{/each}
	</div>
	<div class="w-1/4 p-4 border-r border-gray-700 overflow-y-auto">
		<h2 class="text-2xl font-semibold mb-4">Elements</h2>
		{#each $elements as element}
			<!-- svelte-ignore a11y-no-static-element-interactions -->
			<div
				id="element-{element.id}"
				use:draggable={{
					position: { x: element.x, y: element.y },
					bounds: 'parent',
					gpuAcceleration: true,
					onDrag: ({ detail, target, offsetX, offsetY }) => {
						console.log(`🚀 ~ detail, target:`, detail, target);
						element.x = offsetX;
						element.y = offsetY;
						// checkOverlap(element);
					},
					onDragEnd: () => {
						// checkOverlapAndCombine(element);
						// updateElementSizes();
						// saveToLocalStorage();
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

	<div class="w-full h-full flex flex-col">
		<div
			class=" bg-slate-900 border-t-lime-500 border-lime-900 border-[2rem] w-full h-full flex flex-col items-start justify-apart align-middle"
		>
			<div class="flex p-8 bg-lime-700 w-full">
				<h2 class="text-2xl font-semibold mb-4">Last Combination</h2>
				<div class="bg-gray-800 rounded-lg h-full p-4">
					{$lastElement1.content} + {$lastElement2.content} = {$lastResult.contents}
				</div>
			</div>
			<div bind:this={dragArea} class="dragArea flex w-full h-full"></div>
		</div>
	</div>
</div>
