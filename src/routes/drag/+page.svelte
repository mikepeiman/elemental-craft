<script lang="ts">
	import { browser } from '$app/environment';
	import { draggable } from '@neodrag/svelte';
	import type { DragEventData, DragOptions } from '@neodrag/svelte';
	import { elements, lastElement1, lastElement2, lastResult } from '$lib/stores.js';
	import { onMount } from 'svelte';

	let dragArea: HTMLDivElement;
	let dragRect: DOMRect;
	let dragBounds: Object;
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

	function startElementDrag(e: DragEventData) {
		console.log('Dragging started', e);
		let clone = e.currentNode.cloneNode(true);
		clone.style.position = 'absolute';
		clone.style.left = e.detail.x + 'px';
		clone.style.top = e.detail.y + 'px';
		e.currentNode.appendChild(clone);
	}
</script>

<div class="flex h-screen bg-gray-900 text-gray-200">
	<!-- Left Sidebar -->
	<div class="w-1/4 p-4 border-r border-gray-700 overflow-y-auto">
		<h2 class="text-2xl font-semibold mb-4">Elements</h2>
		{#each $elements as element (element.id)}
			<div
				draggable="true"
				use:draggable={{
					bounds: dragArea,
					gpuAcceleration: true,
					onDragStart: (event) => {
						console.log(`🚀 ~ event:`, event);
						startElementDrag(event);
					},
					onDrag: ({ offsetX, offsetY }) => {
						element.x = offsetX;
						element.y = offsetY;
					},
					onDragEnd: (event) => {}
				}}
				data-original="true"
				class="px-4 py-2 z-10 relative bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors cursor-move"
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
					{$lastElement1.content} + {$lastElement2.content} = {$lastResult.content}
				</div>
			</div>
			<div bind:this={dragArea} class="dragArea flex w-full h-full"></div>
		</div>
	</div>
</div>
