<script>
  import SpotifyWidget from "#lib/components/SpotifyWidget.svelte";
</script>

<div class="screen-container">
  <SpotifyWidget className="spotify-widget" />
</div>

<style>
  .screen-container {
    display: grid;
    width: 100dvw;
    height: 100dvh;
    grid-template-rows: repeat(3, 1fr);
    grid-template-columns: repeat(3, 1fr);
    
    padding: 1rem;
  }

  :global(.spotify-widget) {
    grid-row: 3;
    grid-column: 0;
    place-self: end start;
  }
</style>