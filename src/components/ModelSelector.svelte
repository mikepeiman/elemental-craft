<script>
	import { onMount, tick } from 'svelte';
	import { selectedModels, extendedModelNames, extendedModelNames2 } from '$lib/stores.js';
	// import { clickOutside } from './clickOutside.js'; // We'll create this directive

	let isOpen = false;
	let selectAllExtended = false;
	let selectAllExtended2 = false;
	let dropdownElement;

	// Initialize with the first model selected
	if ($selectedModels.length === 0) {
		$selectedModels = [extendedModelNames[0]];
	}
	$: console.log(`🚀 ~ $selectedModels:`, $selectedModels);

	function clickOutside(node) {
		const handleClick = (event) => {
			if (node && !node.contains(event.target) && !event.defaultPrevented) {
				node.dispatchEvent(new CustomEvent('click_outside', node));
			}
		};

		document.addEventListener('click', handleClick, true);

		return {
			destroy() {
				document.removeEventListener('click', handleClick, true);
			}
		};
	}

	function toggleDropdown() {
		isOpen = !isOpen;
	}

	function closeDropdown() {
		isOpen = false;
	}

	function updateModels() {
		console.log('Selected models:', $selectedModels);
	}

	function toggleSelectAll(collection) {
		if (collection === 'extended') {
			selectAllExtended = !selectAllExtended;
			if (selectAllExtended) {
				$selectedModels = [...new Set([...$selectedModels, ...extendedModelNames])];
			} else {
				$selectedModels = $selectedModels.filter((model) => !extendedModelNames.includes(model));
			}
		} else if (collection === 'extended2') {
			selectAllExtended2 = !selectAllExtended2;
			if (selectAllExtended2) {
				$selectedModels = [...new Set([...$selectedModels, ...extendedModelNames2])];
			} else {
				$selectedModels = $selectedModels.filter((model) => !extendedModelNames2.includes(model));
			}
		}
	}

	$: {
		selectAllExtended = extendedModelNames.every((model) => $selectedModels.includes(model));
		selectAllExtended2 = extendedModelNames2.every((model) => $selectedModels.includes(model));
	}

	onMount(() => {
		updateModels();
	});
</script>

<div class="relative inline-block text-left" use:clickOutside on:click_outside={closeDropdown}>
	<div>
		<button
			type="button"
			on:click={toggleDropdown}
			class="inline-flex justify-center w-full rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-100 focus:ring-indigo-500"
			aria-haspopup="true"
			aria-expanded="true"
		>
			Select Models
			<svg
				class="-mr-1 ml-2 h-5 w-5"
				xmlns="http://www.w3.org/2000/svg"
				viewBox="0 0 20 20"
				fill="currentColor"
				aria-hidden="true"
			>
				<path
					fill-rule="evenodd"
					d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
					clip-rule="evenodd"
				/>
			</svg>
		</button>
	</div>

	{#if isOpen}
		<div
			bind:this={dropdownElement}
			class="origin-top-right absolute z-10 right-0 mt-2 w-80 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 divide-y divide-gray-100 focus:outline-none"
			role="menu"
			aria-orientation="vertical"
			aria-labelledby="options-menu"
		>
			<div class="py-1 relative z-10" role="none">
				<div class="px-4 py-2 text-sm text-gray-700 font-semibold">Extended Models</div>
				<button
					on:click={() => toggleSelectAll('extended')}
					class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 w-full text-left"
					role="menuitem"
				>
					{selectAllExtended ? 'Deselect All' : 'Select All'} Extended Models
				</button>
				{#each extendedModelNames as model}
					<label
						class="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 cursor-pointer"
					>
						<input
							type="checkbox"
							bind:group={$selectedModels}
							value={model}
							class="form-checkbox h-4 w-4 text-indigo-600 transition duration-150 ease-in-out"
						/>
						<span class="ml-2">{model}</span>
					</label>
				{/each}
			</div>
			<div class="py-1" role="none">
				<div class="px-4 py-2 text-sm text-gray-700 font-semibold">Additional Models</div>
				<button
					on:click={() => toggleSelectAll('extended2')}
					class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 w-full text-left"
					role="menuitem"
				>
					{selectAllExtended2 ? 'Deselect All' : 'Select All'} Additional Models
				</button>
				{#each extendedModelNames2 as model}
					<label
						class="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 cursor-pointer"
					>
						<input
							type="checkbox"
							bind:group={$selectedModels}
							value={model}
							class="form-checkbox h-4 w-4 text-indigo-600 transition duration-150 ease-in-out"
						/>
						<span class="ml-2">{model}</span>
					</label>
				{/each}
			</div>
		</div>
	{/if}
</div>

<style>
	/* Add any additional styles here if needed */
</style>
