<script lang="ts">
  import { onMount } from 'svelte';
  import { PROJECTION_CHANNEL, type ProjectionMessage } from '../application/projectionChannel';

  let text = $state('');
  let reference = $state('');
  let animate = $state(false);

  function fontSizeFor(length: number): string {
    if (length < 50) return 'clamp(3.5rem, 9vw, 7rem)';
    if (length < 100) return 'clamp(3rem, 7vw, 6rem)';
    if (length < 200) return 'clamp(2.5rem, 6vw, 5rem)';
    return 'clamp(2rem, 5vw, 4rem)';
  }

  let plainLength = $derived(text.replace(/<[^>]*>?/gm, '').length);

  onMount(() => {
    document.documentElement.setAttribute('data-projection', 'active');
    let ch: BroadcastChannel | null = null;
    try {
      ch = new BroadcastChannel(PROJECTION_CHANNEL);
      ch.onmessage = (event: MessageEvent<ProjectionMessage>) => {
        const data = event.data;
        if (!data || data.type === 'clear') {
          text = '';
          reference = '';
          return;
        }
        text = data.text ?? '';
        reference = data.reference ?? '';
        animate = false;
        setTimeout(() => (animate = true), 50);
      };
    } catch {
      // BroadcastChannel no disponible
    }
    return () => {
      try {
        ch?.close();
      } catch {
        // ignorar
      }
      document.documentElement.removeAttribute('data-projection');
    };
  });
</script>

<div class="projection-screen">
  {#if !text}
    <p class="projection-idle">AletheiaGateway — Proyección<br /><span>Abre un pasaje en el lector y pulsa «Proyectar».</span></p>
  {:else}
    <div class="projection-body {animate ? 'is-visible' : ''}">
      <div class="projection-text" style="font-size: {fontSizeFor(plainLength)}">{@html text}</div>
      {#if reference}
        <div class="projection-ref">{reference}</div>
      {/if}
    </div>
  {/if}
</div>

<style>
  .projection-screen {
    min-height: 100vh;
    background: #000;
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
    cursor: none;
    user-select: none;
    padding: 4rem;
  }
  .projection-idle {
    font-size: 1.5rem;
    font-weight: 700;
    opacity: 0.6;
  }
  .projection-idle span {
    font-size: 1rem;
    font-weight: 400;
  }
  .projection-body {
    max-width: 1400px;
    display: flex;
    flex-direction: column;
    gap: 2rem;
    opacity: 0;
    transform: scale(0.95);
    transition:
      opacity 0.7s ease-in-out,
      transform 0.7s ease-in-out;
  }
  .projection-body.is-visible {
    opacity: 1;
    transform: scale(1);
  }
  .projection-text {
    font-family: Georgia, 'Noto Serif', serif;
    font-weight: 500;
    line-height: 1.25;
    text-shadow: 0 4px 12px rgba(0, 0, 0, 0.8);
  }
  .projection-text :global(sup) {
    font-size: 0.5em;
    vertical-align: super;
    opacity: 0.6;
    margin-right: 0.2em;
    font-weight: 300;
  }
  .projection-ref {
    font-family: Arial, sans-serif;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    opacity: 0.8;
    font-size: clamp(1.2rem, 2.5vw, 2.5rem);
    color: #93c5fd;
  }
</style>
