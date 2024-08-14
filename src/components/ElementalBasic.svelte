<script lang="ts">
	import { onMount } from 'svelte';
	import { draggable } from '@neodrag/svelte';

	let elements = ['Water', 'Fire', 'Earth', 'Air'];
	let dragElements: { id: number; content: string; x: number; y: number }[] = [];
	let nextId = 1;
	let graphVisElement: HTMLElement;

	function addElement(content: string, x: number, y: number) {
		dragElements = [...dragElements, { id: nextId++, content, x, y }];
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

	function handleDragStart(event: DragEvent, element: string) {
		event.dataTransfer!.setData('text/plain', element);
	}

	onMount(() => {
		// Add initial elements
		elements.forEach((element, index) => {
			addElement(element, 50 + index * 100, 50);
		});
	});
</script>

<div class="game-container">
	<div class="sidebar">
		<h2>Elements</h2>
		{#each elements as element}
			<div class="element" draggable="true" on:dragstart={(e) => handleDragStart(e, element)}>
				{element}
			</div>
		{/each}
	</div>

	<div
		class="graph-vis"
		bind:this={graphVisElement}
		on:drop={handleDrop}
		on:dragover={handleDragOver}
	>
		{#each dragElements as element (element.id)}
			<div
				use:draggable={{
					position: { x: element.x, y: element.y },
					bounds: 'parent'
				}}
				class="draggable-element"
			>
				{element.content}
			</div>
		{/each}
	</div>
</div>

<style>
	.game-container {
		display: flex;
		height: 100vh;
	}

	.sidebar {
		width: 200px;
		padding: 20px;
		background-color: #f0f0f0;
	}

	.element {
		margin: 10px 0;
		padding: 10px;
		background-color: #e0e0e0;
		cursor: move;
	}

	.graph-vis {
		flex-grow: 1;
		position: relative;
		background-color: #ffffff;
		border: 1px solid #ccc;
	}

	.draggable-element {
		position: absolute;
		padding: 10px;
		background-color: #e0e0e0;
		border: 1px solid #ccc;
		border-radius: 5px;
		cursor: move;
		user-select: none;
	}
</style>
