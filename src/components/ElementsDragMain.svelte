<script>
	import { onMount } from 'svelte';
	import { dndzone } from 'svelte-dnd-action';
	import { writable } from 'svelte/store';

	const elements = writable([]);
	const combinations = writable({});

	onMount(async () => {
		// Load initial elements and combinations
		const response = await fetch('/api/init');
		const data = await response.json();
		elements.set(data.initialElements);
		combinations.set(data.combinations);
	});

	function handleCombine(element1, element2) {
		// Check combinations and create new element if valid
		// Update elements and combinations stores
	}

	// DnD zone configuration
	let dndOptions = {
		items: $elements,
		type: 'element',
		flipDurationMs: 300
	};

	function handleDndConsider(e) {
		// Handle drag consideration
	}

	function handleDndFinalize(e) {
		// Handle drag finalization and trigger combination
	}
</script>

<div
	use:dndzone={{ ...dndOptions }}
	on:consider={handleDndConsider}
	on:finalize={handleDndFinalize}
>
	{#each $elements as element (element.id)}
		<div class="element">
			{element.name}
		</div>
	{/each}
</div>
