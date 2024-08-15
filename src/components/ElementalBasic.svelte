<script>
	import { onMount } from 'svelte';

	let items = ['Apple', 'Banana', 'Cherry', 'Date', 'Elderberry'];
	let droppedItems = [];
	let draggedItem = null;
	let mainArea;
	let dragOffset = { x: 0, y: 0 };

	function handleDragStart(event, item, isNewItem = true) {
		draggedItem = isNewItem ? item : event.target;
		const rect = event.target.getBoundingClientRect();
		dragOffset.x = event.clientX - rect.left;
		dragOffset.y = event.clientY - rect.top;
		event.dataTransfer.setData('text/plain', isNewItem ? item : event.target.id);
		event.dataTransfer.effectAllowed = 'move';
		if (!isNewItem) {
			setTimeout(() => (event.target.style.display = 'none'), 0);
		}
	}

	function handleDragOver(event) {
		event.preventDefault();
		event.dataTransfer.dropEffect = 'move';
	}

	function handleDrop(event) {
		event.preventDefault();
		const rect = mainArea.getBoundingClientRect();
		const x = Math.max(
			0,
			Math.min(
				event.clientX - rect.left - dragOffset.x,
				rect.width - (draggedItem.offsetWidth || 100)
			)
		);
		const y = Math.max(
			0,
			Math.min(
				event.clientY - rect.top - dragOffset.y,
				rect.height - (draggedItem.offsetHeight || 40)
			)
		);

		if (typeof draggedItem === 'string') {
			// New item being dropped
			droppedItems = [...droppedItems, { id: Date.now(), content: draggedItem, x, y }];
		} else {
			// Existing item being moved
			const id = parseInt(draggedItem.id.split('-')[1]);
			droppedItems = droppedItems.map((item) => (item.id === id ? { ...item, x, y } : item));
		}
		draggedItem = null;
	}

	function handleDragEnd(event) {
		if (event.target.style.display === 'none') {
			event.target.style.display = '';
		}
	}

	onMount(() => {
		mainArea = document.getElementById('main-area');
		mainArea.addEventListener('dragover', handleDragOver);
		mainArea.addEventListener('drop', handleDrop);

		return () => {
			mainArea.removeEventListener('dragover', handleDragOver);
			mainArea.removeEventListener('drop', handleDrop);
		};
	});
</script>

<div class="flex h-screen w-screen bg-gray-900 text-gray-200">
	<!-- Left Sidebar -->
	<div class="w-1/4 p-4 border-r border-gray-700 overflow-y-auto">
		<h2 class="text-2xl font-semibold mb-4">Elements</h2>
		<div class="flex flex-wrap gap-2">
			{#each items as item}
				<div
					draggable="true"
					on:dragstart={(e) => handleDragStart(e, item)}
					class="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors cursor-move"
				>
					{item}
				</div>
			{/each}
		</div>
	</div>

	<!-- Central Graph View -->
	<div class="w-3/4 p-4">
		<h2 class="text-2xl font-semibold mb-4">Dropped Elements</h2>
		<div id="main-area" class="graph-vis bg-gray-800 relative rounded-lg h-full p-4">
			{#each droppedItems as item (item.id)}
				<div
					id="item-{item.id}"
					draggable="true"
					on:dragstart={(e) => handleDragStart(e, null, false)}
					on:dragend={handleDragEnd}
					class="draggable-element absolute px-4 py-2 bg-gray-700 text-white rounded-md cursor-move"
					style="left: {item.x}px; top: {item.y}px;"
				>
					{item.content}
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
		transition: all 0.1s ease;
	}
</style>
