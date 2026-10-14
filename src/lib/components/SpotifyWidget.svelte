<!-- svelte-ignore a11y_missing_attribute -->

<script lang="ts">
  import { STATUSBADGES_URL } from '$app/env/public';
	import { onMount, tick } from 'svelte';

  type Props = { className?: string };

  let { className }: Props = $props();

  type UserStatus = "idle" | "dnd" | "online" | "offline";
  type Button = {
    label: string,
    url: string
  }

  interface Activity {
    /**
     * - 0: Playing
     * - 1: Streaming
     * - 2: Listening
     * - 3: Watching
     * - 4: Custom
     * - 5: Competing
     */
    type: 0 | 1 | 2 | 3 | 4 | 5,
    name: string,
    /** Stream URL, is validated when type is 1 */
    url?: string
    /** Unix timestamp (in milliseconds) of when the activity was added to the user’s session */
    created_at: number,
    timestamps?: {
      /** Unix time (in milliseconds) of when the activity started */
      start?: number,
      /** Unix time (in milliseconds) of when the activity ends */
      end?: number
    },
    application_id?: number,
    /**
     * - 0: Name / "Listening to Spotify"
     * - 1: State / "Listening to Rick Astley"
     * - 2: Details / "Listening to Never Gonna Give You Up"
     */
    status_display_type?: 0 | 1 | 2,
    /** What the player is currently doing */
    details?: string,
    /** URL that is linked when clicking on the details text */
    details_url?: string,
    /** User’s current party status, or text used for a custom status */
    state?: string,
    /** URL that is linked when clicking on the state text */
    state_url?: string,
    /**	Emoji used for a custom status */
    emoji?: {
      name: string,
      id?: number,
      animated?: boolean
    },
    /**	Information for the current party of the player */
    party?: {
      id?: string,
      size?: [number, number]
    },
    /** Images for the presence and their hover texts */
    assets?: {
      large_image?: string,
      large_text?: string,
      large_url?: string,
      small_image?: string,
      small_text?: string,
      small_url?: string,
      invite_cover_image?: string
    }
    /** Secrets for Rich Presence joining and spectating */
    secrets?: {
      join?: string,
      spectate?: string,
      match?: string
    },
    /** Whether or not the activity is an instanced game session */
    instance?: boolean,
    /** Activity flags `OR`d together, describes what the payload includes */
    flags?: number,
    /** Custom buttons shown in the Rich Presence (max 2) */
    buttons?: [Button?, Button?]
  }

  type UserPresence = {
    status: UserStatus,
    guild_id?: number,
    client_status: {
      desktop?: UserStatus,
      mobile?: UserStatus,
      web?: UserStatus,
      vr?: UserStatus
    },
    activities: Activity[]
  }

  const OFFLINE: UserPresence = { status: "offline", client_status: {}, activities: [] };
  let userPresence = $state<UserPresence>(OFFLINE);

  let userStatus = $derived(userPresence.status);

  function findSpotifyActivity(p: UserPresence): Activity | null {
    if (p.status === "offline") return null;
    return p.activities.find(a => a.type === 2 && a.name === "Spotify") ?? null;
  }

  function songKey(a: Activity | null) {
    return a ? `${a.details}|${a.state}|${a.assets?.large_text}` : null;
  }

  let spotifyActivity = $derived(findSpotifyActivity(userPresence))
  let coverArtUrl = $derived(`https://i.scdn.co/image/${spotifyActivity?.assets?.large_image?.replace('spotify:', '')}`);

  async function refetchPresence(): Promise<UserPresence> {
    try {
      const res = await fetch(STATUSBADGES_URL);
      if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText} during user presence fetch.`);
      return await res.json();
    } catch (e) {
      console.error("Failed to fetch user presence.", e);
      return OFFLINE; // show no song
    }
  }

  let animationTrigger = $state(0);
  let currentKey: string | null = null;
  onMount(() => {
    let active = true;

    async function poll() {
      const newPresence = await refetchPresence();
      if (!active) return; // component died dont fetch

      const newKey = songKey(findSpotifyActivity(newPresence));
      const changed = newKey !== currentKey;
      currentKey = newKey;

      document.startViewTransition(async () => {
        if (changed) {
          if (!active) return;
          userPresence = newPresence;
          animationTrigger++
          await tick();
        };
      })
    }

    poll();
    const interval = setInterval(poll, 3000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  });

  function wrapUnknown(value: any) {
    return value != undefined ? value : "Unknown"
  }
</script>

<svg style="position:absolute; visibility:hidden;">
  <filter id="pixelate" x="0" y="0">
      <feFlood x="0" y="0" height="1" width="1" result="flood"></feFlood>
      <feComposite width="3" height="3" in="flood" result="composite"></feComposite>
      <feTile in="composite" result="tiled"></feTile>
      <feComposite in="SourceGraphic" in2="tiled" operator="in"></feComposite>
      <feMorphology operator="dilate" radius="1" result="final"></feMorphology>
  </filter>
</svg>

{#key animationTrigger}
<div class={["widget-container", className, {"has-cover-art": spotifyActivity?.assets?.large_image != undefined}]} style="--cover-art-url: url('{coverArtUrl}');">
  <div class="cover-art-container">
    {#if spotifyActivity?.assets?.large_image}
      <img src={coverArtUrl} />
    {/if}
  </div>
  <div class="song-details-container">
    {#if spotifyActivity}
      <p class="song-name">{ wrapUnknown(spotifyActivity.details) } <span class="album-name">on { wrapUnknown(spotifyActivity.assets?.large_text) }</span></p>
      <p class="artist-name">by { wrapUnknown(spotifyActivity.state) }</p>
      {:else}
      <p class="artist-name">No song.</p>
    {/if}
  </div>
</div>
{/key}

<style>
  .widget-container {
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;
    gap: 1em;

    position: relative;
    overflow: hidden;

    background-color: gray;
    box-shadow: 0 10px 10px rgb(0, 0, 0, 0.25);
    width: max-content;
    height: max-content;
    padding: 0.5em;
    padding-right: 1em;
    border-radius: 4px;

    animation: fadeOut 2s ease 3s both;

    &.has-cover-art {
      background-color: transparent;
      &::before {
        position: absolute;
        content: '';
        width: 1000%;
        height: 1000%;
        left: 50%; top: 50%;
        translate: -50% -50%;

        background-image: var(--cover-art-url);
        background-size: cover;
        background-position: center;

        filter: blur(128px) brightness(0.5);

        z-index: -1;
      }
    }

    .cover-art-container {
      width: 5em;
      height: 5em;
      background-color: rgb(0, 0, 0, 0.1);
      border-radius: 4px;

      img {
        width: 100%;
        height: auto;
        border-radius: 4px;
      }
    }

    .song-details-container {
      flex: 1;

      font-family: 'MinecraftDefault', 'Poppins', 'Helvetica';
      font-size: 1.5em;
      line-height: normal;
      color: white;
      -webkit-text-stroke: 0.175em black;
      paint-order: stroke fill;
      image-rendering: pixelated;
      max-width: 400px;

      p.song-name { 
        padding-left: 4px;
        font-weight: bold;
        .album-name { font-weight: normal; opacity: 0.25; }
      }

      p.artist-name {
        padding-left: 0.175em;
        font-style: italic;
        opacity: 0.5;
      }

      p, span {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
    }
  }

  @keyframes fadeOut {
    0% {
      opacity: 1;
    }

    100% {
      opacity: 0.15;
    }
  }
</style>