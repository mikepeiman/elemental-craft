<script>
	import ElementsMain from '../components/ElementsMain.svelte';
	import ThemeSelector from '../components/ThemeSelector.svelte';
</script>

<!-- YOU CAN DELETE EVERYTHING IN THIS PAGE -->

<div class="container h-screen mx-auto flex justify-center items-center">
	<ElementsMain />
	<div class="space-y-5">
		<h1 class="h1">Elemental Craft</h1>
		<p>Start by exploring themes:</p>
		<ThemeSelector />
	</div>
</div>
