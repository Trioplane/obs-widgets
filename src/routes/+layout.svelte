<script lang="ts">
	import type { LayoutProps } from './$types';
	import '#lib/css_reset.css';

	let { children }: LayoutProps = $props();
</script>

<svelte:head>
	<link rel="icon" href="https://avatars.githubusercontent.com/u/87922281" />
</svelte:head>

{@render children()}
