<script>
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { elements, combinations, generationStore } from '$lib/stores.js';
	import { generateCombination, generateRandomCombinations } from '$lib/generateCombinations.js';

	let selectedElements = [];
	let result = '';
	let randomGenerationCount = 10;

	onMount(() => {
		if (browser) {
			// Load data from localStorage
			const storedElements = localStorage.getItem('elements');
			const storedCombinations = localStorage.getItem('combinations');

			if (storedElements) {
				elements.set(JSON.parse(storedElements));
			}
			if (storedCombinations) {
				combinations.set(JSON.parse(storedCombinations));
			}

			// Subscribe to stores and update localStorage when they change
			const unsubscribeElements = elements.subscribe((value) => {
				localStorage.setItem('elements', JSON.stringify(value));
			});

			const unsubscribeCombinations = combinations.subscribe((value) => {
				localStorage.setItem('combinations', JSON.stringify(value));
			});

			return () => {
				unsubscribeElements();
				unsubscribeCombinations();
			};
		}
	});

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

<div class="flex h-screen bg-gray-900 text-gray-200">
	<!-- Left Sidebar -->
	<div class="w-1/4 p-4 border-r border-gray-700 overflow-y-auto">
		<h2 class="text-2xl font-semibold mb-4">Elements</h2>
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

		<div class="mt-8">
			<h2 class="text-2xl font-semibold mb-4">Selected Elements</h2>
			<div class="flex gap-4">
				{#each selectedElements as element}
					<span class="px-4 py-2 bg-gray-800 rounded-md text-cyan-400">{element}</span>
				{/each}
			</div>
		</div>

		<div class="mt-8">
			<h2 class="text-2xl font-semibold mb-4">Result</h2>
			<p class="text-xl font-medium text-lime-400">
				{result || 'Combine elements to see the result'}
			</p>
		</div>

		<div class="mt-8">
			<h2 class="text-2xl font-semibold mb-4">Random Generation</h2>
			<div class="flex items-center gap-4">
				<input
					type="number"
					bind:value={randomGenerationCount}
					min="1"
					max="1000"
					class="px-4 py-2 border border-gray-700 rounded-md w-24 bg-gray-800 text-white"
				/>
				<button
					on:click={toggleGeneration}
					class="px-6 py-2 bg-lime-700 text-white rounded-md hover:bg-lime-600 transition-colors"
				>
					{$generationStore.isGenerating ? 'Stop Generation' : 'Start Random Generation'}
				</button>
			</div>
		</div>

		<div class="mt-8 bg-gray-800 p-4 rounded-lg">
			<h3 class="text-xl font-semibold mb-4">Generation Status</h3>
			<p class="mb-2">
				Status:
				<span class={$generationStore.isGenerating ? 'text-lime-600' : 'text-red-600'}>
					{$generationStore.isGenerating ? 'Generating combinations...' : 'Generation stopped'}
				</span>
			</p>
			<p class="mb-2">Total elements: <span class="font-medium">{$elements.length}</span></p>
			<p>
				Total combinations: <span class="font-medium">{Object.keys($combinations).length}</span>
			</p>
		</div>
	</div>

	<!-- Central Graph View -->
	<div class="w-3/4 p-4">
		<h2 class="text-2xl font-semibold mb-4">Element Connections</h2>
		<div class="bg-gray-800 rounded-lg h-full p-4 flex items-center justify-center">
			<p class="text-xl text-gray-400">Graph visualization will be implemented here</p>
		</div>
	</div>
</div>
