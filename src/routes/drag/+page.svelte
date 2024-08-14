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
	let mouseX = 0;
	let mouseY = 0;

	function handleMouseMove(event) {
		mouseX = event.clientX;
		mouseY = event.clientY;
	}

	function notePosition() {
		console.log(`🚀 ~ notePosition ~ mouseX, mouseY:`, mouseX, mouseY);
	}
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

	function startElementDrag(e: DragEventData, element) {
		console.log(`🚀 ~ startElementDrag ~ element:`, element);
		console.log('Dragging started', e);
		let original = e.target;
		if (original.parentElement.classList.contains('sidebar')) {
			let originalBounds = original.getBoundingClientRect();
			console.log(`🚀 ~ startElementDrag ~ originalBounds:`, originalBounds);
			let replacement = e.target.cloneNode(true);
			replacement.dataset.original = 'true';
			replacement.dataset.replacement = 'false';
			original.dataset.original = 'false';
			original.dataset.replacement = 'true';
			original.style.position = 'absolute';
			replacement.style.left = e.detail.x + 'px';
			replacement.style.top = e.detail.y + 'px';
			original.parentElement.appendChild(replacement);
			// original.parentElement.set(dragArea);
		} else {
			return;
		}
	}

	function endElementDrag(e: DragEventData, element) {
		console.log(`🚀 ~ endElementDrag ~ element:`, element);
		console.log('Dragging ended', e);
		let currentElement = e.target;
		dragArea.appendChild(currentElement);

		currentElement.style.left = mouseX;

		console.log(`🚀 ~ endElementDrag ~ mouseX mouseY:`, mouseX, mouseY);
		currentElement.style.top = mouseY;
	}
</script>

<svelte:window on:mousemove={handleMouseMove} on:mouseup={notePosition} />
<div class="flex h-screen bg-gray-900 text-gray-200">
	<!-- Left Sidebar -->
	<div class="sidebar w-1/4 p-4 border-r border-gray-700 overflow-y-auto">
		<h2 class="text-2xl font-semibold mb-4">Elements</h2>
		{#each $elements as element}
			<div
				id="element-{element.id}"
				use:draggable
				on:neodrag:start={(e) => startElementDrag(e, element)}
				on:neodrag={(e) => {
					handleMouseMove(e);
				}}
				on:neodrag:end={(e) => endElementDrag(e, element)}
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
					bounds: 'parent',
					gpuAcceleration: true,
					onDrag: (e) => {
						console.log(`🚀 ~ e:`, e);

						element.x = e.offsetX;
						element.y = e.offsetY;
						// checkOverlap(element);
					},
					onDragEnd: () => {
						// checkOverlapAndCombine(element);
						// updateElementSizes();
						// saveToLocalStorage();
					}
				}}
				on:mousemove={handleMouseMove}
				on:contextmenu|preventDefault={() => removeElement(element.id)}
				class="draggable-element bg-orange-500 px-4 py-2 rounded-sm"
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
			<div bind:this={dragArea} id="dragArea" class="dragArea relative flex w-full h-full"></div>
		</div>
	</div>
</div>
