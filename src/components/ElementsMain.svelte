<script>
	import { onMount } from 'svelte';
	import { elements, combinations, generationStore } from '$lib/stores.js';
	import { generateCombination, generateRandomCombinations } from '$lib/generateCombinations.js';

	let selectedElements = [];
	let result = '';
	let randomGenerationCount = 10;

	function selectElement(element) {
		if (selectedElements.length < 2) {
			selectedElements = [...selectedElements, element];
		}
		if (selectedElements.length === 2) {
			combineElements();
		}
	}

	async function combineElements() {
		if (selectedElements.length === 2) {
			result = await generateCombination(selectedElements[0], selectedElements[1]);
			selectedElements = [];
		}
	}

	async function toggleGeneration() {
		if ($generationStore.isGenerating) {
			generationStore.stopGeneration();
		} else {
			generateRandomCombinations(randomGenerationCount);
		}
	}
</script>

<div class="container mx-auto px-4 py-8 max-w-4xl">
	<h1 class="text-4xl font-bold text-center mb-8 text-indigo-600">Infinite Craft</h1>

	<div class="mb-8">
		<h2 class="text-2xl font-semibold mb-4 text-gray-700">Elements</h2>
		<div class="flex flex-wrap gap-2">
			{#each $elements as element}
				<button
					on:click={() => selectElement(element)}
					class="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
				>
					{element}
				</button>
			{/each}
		</div>
	</div>

	<div class="mb-8">
		<h2 class="text-2xl font-semibold mb-4 text-gray-700">Selected Elements</h2>
		<div class="flex gap-4">
			{#each selectedElements as element}
				<span class="px-4 py-2 bg-gray-200 rounded-md">{element}</span>
			{/each}
		</div>
	</div>

	<div class="mb-8">
		<h2 class="text-2xl font-semibold mb-4 text-gray-700">Result</h2>
		<p class="text-xl font-medium text-indigo-600">
			{result || 'Combine elements to see the result'}
		</p>
	</div>

	<div class="mb-8">
		<h2 class="text-2xl font-semibold mb-4 text-gray-700">Random Generation</h2>
		<div class="flex items-center gap-4">
			<input
				type="number"
				bind:value={randomGenerationCount}
				min="1"
				max="1000"
				class="px-4 py-2 border border-gray-300 rounded-md w-24"
			/>
			<button
				on:click={toggleGeneration}
				class="px-6 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
			>
				{$generationStore.isGenerating ? 'Stop Generation' : 'Start Random Generation'}
			</button>
		</div>
	</div>

	<div class="bg-gray-100 p-6 rounded-lg">
		<h3 class="text-xl font-semibold mb-4 text-gray-700">Generation Status</h3>
		<p class="mb-2">
			Status:
			<span class={$generationStore.isGenerating ? 'text-green-600' : 'text-red-600'}>
				{$generationStore.isGenerating ? 'Generating combinations...' : 'Generation stopped'}
			</span>
		</p>
		<p class="mb-2">Total elements: <span class="font-medium">{$elements.length}</span></p>
		<p>Total combinations: <span class="font-medium">{Object.keys($combinations).length}</span></p>
	</div>
</div>
