<script>
	import { onMount } from 'svelte';
	import { elements, combinations } from '$lib/stores.js';
	import { generateCombinations } from '$lib/generateCombinations.js';

	let selectedElements = [];
	let result = '';

	onMount(async () => {
		// Generate initial combinations
		await generateCombinations($elements, 10000);
	});

	function selectElement(element) {
		if (selectedElements.length < 2) {
			selectedElements = [...selectedElements, element];
		}
		if (selectedElements.length === 2) {
			combineElements();
		}
	}

	function combineElements() {
		const key = selectedElements.sort().join(',');
		result = $combinations[key] || 'No combination found';
		selectedElements = [];
	}
</script>

<h1>Infinite Craft</h1>

<div>
	<h2>Elements</h2>
	{#each $elements as element}
		<button on:click={() => selectElement(element)}>{element}</button>
	{/each}
</div>

<div>
	<h2>Selected Elements</h2>
	{#each selectedElements as element}
		<span>{element}</span>
	{/each}
</div>

<div>
	<h2>Result</h2>
	<p>{result}</p>
</div>
