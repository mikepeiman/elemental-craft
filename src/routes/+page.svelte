<script>
	import E6 from '../components/E6.svelte';
	import E7 from '../components/E7.svelte';
	// import Elemental from '../components/Elemental.svelte';
	// import ElementalBasic from '../components/ElementalBasic.svelte';
	// import ElementalNeodrag from '../components/ElementalNeodrag.svelte';
	// import ElementsMain from '../components/ElementsMain.svelte';
	// import ThemeSelector from '../components/ThemeSelector.svelte';
</script>

<!-- YOU CAN DELETE EVERYTHING IN THIS PAGE -->

<div id="app-main" class="container h-screen mx-auto grid justify-center items-center flex-col">
	<div class=" flex items-center justify-center">
		<h1 class="h1">Elemental Craft</h1>
		<!-- <p>Start by exploring themes:</p>
		<ThemeSelector /> -->
	</div>
	<div class="flex flex-col h-full">
		<!-- <ElementalBasic /> -->
		<!-- <ElementalNeodrag /> -->
		<!-- <E6 /> -->
		<E7 />

		<!-- <Elemental /> -->
		<!-- <ElementsMain /> -->
	</div>
</div>

<style>
	#app-main {
		display: grid;
		grid-template-rows: 8rem 1fr;
	}
</style>
