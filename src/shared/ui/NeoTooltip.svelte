<script lang="ts">
  import { onMount, onDestroy, tick } from 'svelte';

  let visible = $state(false);
  let content = $state('');
  let tooltipX = $state(0);
  let tooltipY = $state(0);
  let currentTarget = $state<HTMLElement | null>(null);
  let tooltipEl = $state<HTMLDivElement | null>(null);

  function updatePosition(el: HTMLElement) {
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const prefersBottom = el.getAttribute('data-tooltip-pos') === 'bottom';

    // Measure rendered dimensions of the tooltip
    const tipWidth = tooltipEl ? tooltipEl.offsetWidth : 160;
    const tipHeight = tooltipEl ? tooltipEl.offsetHeight : 28;

    // Center horizontally over target element
    const targetCenterX = rect.left + rect.width / 2;
    const rawX = targetCenterX - tipWidth / 2;

    // Clamp horizontally so it NEVER overflows the left (min 10px) or right (max window.innerWidth - tipWidth - 10px)
    const maxX = Math.max(10, window.innerWidth - tipWidth - 10);
    tooltipX = Math.max(10, Math.min(maxX, rawX));

    // Vertical placement
    const canFitTop = rect.top >= tipHeight + 12;
    const useBottom = prefersBottom || !canFitTop;

    if (useBottom) {
      const bottomY = rect.bottom + 8;
      // If bottom also overflows screen, clamp to bottom margin
      if (bottomY + tipHeight > window.innerHeight - 10 && canFitTop) {
        tooltipY = Math.max(8, rect.top - tipHeight - 8);
      } else {
        tooltipY = Math.min(window.innerHeight - tipHeight - 8, bottomY);
      }
    } else {
      tooltipY = Math.max(8, rect.top - tipHeight - 8);
    }
  }

  async function handlePointerOver(e: Event) {
    const target = (e.target as HTMLElement)?.closest?.('[data-tooltip]') as HTMLElement | null;
    if (!target) {
      if (visible && currentTarget && !currentTarget.contains(e.target as Node)) {
        visible = false;
        currentTarget = null;
      }
      return;
    }

    const text = target.getAttribute('data-tooltip')?.trim();
    if (!text) {
      visible = false;
      return;
    }

    // Strip native title if present to avoid conflicting browser tooltips
    if (target.hasAttribute('title')) {
      target.removeAttribute('title');
    }

    content = text;
    currentTarget = target;
    visible = true;

    // Wait for Svelte DOM render, then measure and position accurately
    await tick();
    requestAnimationFrame(() => {
      if (currentTarget) {
        updatePosition(currentTarget);
      }
    });
  }

  function handlePointerOut(e: Event) {
    const target = (e.target as HTMLElement)?.closest?.('[data-tooltip]') as HTMLElement | null;
    if (target && target === currentTarget) {
      visible = false;
      currentTarget = null;
    }
  }

  function handleScrollOrResize() {
    if (visible && currentTarget) {
      updatePosition(currentTarget);
    }
  }

  onMount(() => {
    document.addEventListener('pointerover', handlePointerOver, { passive: true });
    document.addEventListener('pointerout', handlePointerOut, { passive: true });
    document.addEventListener('focusin', handlePointerOver, { passive: true });
    document.addEventListener('focusout', handlePointerOut, { passive: true });
    window.addEventListener('scroll', handleScrollOrResize, { passive: true });
    window.addEventListener('resize', handleScrollOrResize, { passive: true });
  });

  onDestroy(() => {
    if (typeof document !== 'undefined') {
      document.removeEventListener('pointerover', handlePointerOver);
      document.removeEventListener('pointerout', handlePointerOut);
      document.removeEventListener('focusin', handlePointerOver);
      document.removeEventListener('focusout', handlePointerOut);
      window.removeEventListener('scroll', handleScrollOrResize);
      window.removeEventListener('resize', handleScrollOrResize);
    }
  });
</script>

{#if visible && content}
  <div
    bind:this={tooltipEl}
    class="neo-tooltip-bubble"
    style="left: {tooltipX}px; top: {tooltipY}px;"
    role="tooltip"
    aria-hidden="true"
  >
    <div class="neo-tooltip-content">{content}</div>
  </div>
{/if}

<style>
  .neo-tooltip-bubble {
    position: fixed;
    z-index: 9999999;
    pointer-events: none;
    width: max-content;
    max-width: min(280px, calc(100vw - 20px));
    box-sizing: border-box;
    animation: neoTooltipIn 0.08s ease-out;
  }

  .neo-tooltip-content {
    background-color: var(--text-main, #1a1a18);
    color: #ffffff;
    border: 2px solid var(--text-main, #1a1a18);
    border-radius: 0px;
    box-shadow: 3px 3px 0px 0px rgba(0, 0, 0, 0.45);
    font-family: var(--font-mono, 'JetBrains Mono', monospace);
    font-size: 0.75rem;
    font-weight: 700;
    line-height: 1.35;
    letter-spacing: 0.02em;
    padding: 5px 10px;
    white-space: normal;
    word-break: normal;
    overflow-wrap: break-word;
    text-align: center;
    box-sizing: border-box;
  }

  @keyframes neoTooltipIn {
    from {
      opacity: 0;
      transform: scale(0.96);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }
</style>
