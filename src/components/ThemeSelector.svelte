<script>
	import { onMount } from 'svelte';

	const themes = [
		'skeleton',
		'wintry',
		'modern',
		'hamlindigo',
		'rocket',
		'sahara',
		'gold-nouveau',
		'vintage',
		'seafoam',
		'crimson'
	];

	let selectedTheme = 'skeleton';

	function updateTheme() {
		document.body.setAttribute('data-theme', selectedTheme);
	}

	onMount(() => {
		updateTheme();
	});
</script>

<div class="max-w-md mx-auto">
	<label for="theme-select" class="block text-sm font-medium text-gray-700 mb-2"
		>Select Theme:</label
	>
	<div class="relative">
		<select
			id="theme-select"
			bind:value={selectedTheme}
			on:change={updateTheme}
			class="block appearance-none w-full bg-white border border-gray-300 text-gray-700 py-3 px-4 pr-8 rounded leading-tight focus:outline-none focus:bg-white focus:border-gray-500"
		>
			{#each themes as theme}
				<option value={theme}>
					{theme.charAt(0).toUpperCase() + theme.slice(1)}
				</option>
			{/each}
		</select>
		<div
			class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700"
		>
			<!-- <svg class="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
				<path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
			</svg> -->
		</div>
	</div>
</div>

<style>
	/* You can add any additional styles here if needed */
</style>
