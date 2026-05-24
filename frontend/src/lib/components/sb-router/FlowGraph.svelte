<!--
  Источник дизайна: singbox-router/project/parts/FlowGraph.jsx (FlowGraph)
  Hero-баннер сверху Beginner view. 4 station'а + 3 arrow'а в grid layout.
  Outbounds station — inline 2x2 grid с dot+label вместо FlowStation primitive.
  Engine station клик → openDrawer (дублирует pill в PageShell header).
-->

<script lang="ts" module>
  import type { FlowOutboundTone } from './flowData';
  import type { StatusDotVariant } from '$lib/components/ui';

  /**
   * Map FlowOutboundTone → StatusDotVariant.
   * 'accent' не существует в StatusDotVariant → fallback на 'info'.
   */
  export function mapTone(t: FlowOutboundTone): StatusDotVariant {
    if (t === 'success') return 'success';
    if (t === 'error')   return 'error';
    if (t === 'warning') return 'warning';
    if (t === 'muted')   return 'muted';
    return 'info'; // 'accent' → 'info' (closest available in StatusDotVariant)
  }
</script>

<script lang="ts">
  import { singboxRouter as singboxRouterStore } from '$lib/stores/singboxRouter';
  import { StatusDot } from '$lib/components/ui';
  import FlowStation from './FlowStation.svelte';
  import FlowArrow from './FlowArrow.svelte';
  import { deriveOutboundList } from './flowData';
  import { openDrawer } from './drawerStore';

  const status = singboxRouterStore.status;
  const outboundsStore = singboxRouterStore.outbounds;

  let s = $derived($status);
  let ob = $derived($outboundsStore);

  let engineOn = $derived(s?.enabled ?? false);
  let devicesCount = $derived(s?.deviceCount ?? 0);
  let rulesCount = $derived(s?.ruleCount ?? 0);
  let policyName = $derived(s?.policyName || '—');

  let outboundList = $derived(deriveOutboundList(ob ?? []));
  let totalOutbounds = $derived((ob ?? []).length);

  let rulesSub = $derived(engineOn ? `${rulesCount} правил · first-match` : 'выключен');
  let devicesSub = $derived(`policy: ${policyName}`);
</script>

<div class="flow">
  <!-- Faint grid pattern overlay -->
  <svg class="bg-grid" aria-hidden="true">
    <defs>
      <pattern id="flowgrid" width="24" height="24" patternUnits="userSpaceOnUse">
        <path d="M 24 0 L 0 0 0 24" fill="none" stroke="currentColor" stroke-width="1" />
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#flowgrid)" />
  </svg>

  <div class="row">
    <!-- Devices -->
    <FlowStation
      tone="accent"
      title="Устройства"
      metric={devicesCount}
      sub={devicesSub}
    >
      {#snippet icon()}
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <rect x="2" y="3" width="14" height="10" rx="2" />
          <rect x="16" y="8" width="6" height="13" rx="1" />
          <line x1="9" y1="17" x2="9" y2="21" />
          <line x1="5" y1="21" x2="13" y2="21" />
        </svg>
      {/snippet}
    </FlowStation>

    <FlowArrow active={engineOn} />

    <!-- sing-box (engine) -->
    <FlowStation
      tone={engineOn ? 'success' : 'muted'}
      title="sing-box"
      metric={rulesCount}
      sub={rulesSub}
      glow={engineOn}
      onclick={openDrawer}
    >
      {#snippet icon()}
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
        </svg>
      {/snippet}
    </FlowStation>

    <FlowArrow active={engineOn} />

    <!-- Outbounds (inline tile, не FlowStation) -->
    <div class="outbounds">
      <div class="outbounds-label">OUTBOUNDS · {totalOutbounds}</div>
      {#if totalOutbounds === 0}
        <div class="outbounds-empty">нет outbounds</div>
      {:else}
        <div class="outbounds-grid">
          {#each outboundList.items as item (item.tag)}
            <div class="ob-row">
              <StatusDot variant={mapTone(item.tone)} size="sm" />
              <span class="ob-label">{item.label}</span>
            </div>
          {/each}
          {#if outboundList.hiddenCount > 0}
            <div class="ob-row ob-more">
              <span>+{outboundList.hiddenCount} ещё</span>
            </div>
          {/if}
        </div>
      {/if}
    </div>

    <FlowArrow active={engineOn} />

    <!-- Internet -->
    <FlowStation
      tone="info"
      title="Интернет"
      metric={null}
      sub="через WAN/tunnel"
    >
      {#snippet icon()}
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="10" />
          <line x1="2" y1="12" x2="22" y2="12" />
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
      {/snippet}
    </FlowStation>
  </div>
</div>

<style>
  .flow {
    position: relative;
    padding: 20px 24px;
    background: linear-gradient(180deg,
      color-mix(in srgb, var(--accent) 5%, var(--bg-secondary)) 0%,
      var(--bg-secondary) 100%);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    overflow: hidden;
  }

  .bg-grid {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    opacity: 0.04;
    pointer-events: none;
    color: var(--text-primary);
  }

  .row {
    position: relative;
    display: grid;
    grid-template-columns: 1fr auto 1fr auto 1.2fr auto 1fr;
    align-items: center;
    gap: 12px;
  }

  .outbounds {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 8px 12px;
    background: var(--bg-primary);
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    min-height: 72px;
  }
  .outbounds-label {
    font-size: 10px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--text-muted);
    margin-bottom: 2px;
  }
  .outbounds-empty {
    font-size: 11px;
    color: var(--text-muted);
    font-style: italic;
  }
  .outbounds-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 4px;
  }
  .ob-row {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 3px 6px;
    border-radius: 4px;
    font-size: 11px;
    color: var(--text-secondary);
    font-family: var(--font-mono);
  }
  .ob-label {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .ob-more {
    color: var(--text-muted);
    font-style: italic;
    grid-column: span 2;
    text-align: right;
  }

  /* ── Mobile: vertical orientation (<768px) ── */
  @media (max-width: 768px) {
    .flow {
      padding: 14px 16px;
    }

    .row {
      display: flex !important;
      flex-direction: column !important;
      grid-template-columns: none !important;
      align-items: stretch;
      gap: 6px;
    }

    /* Rotate horizontal arrows 90° to point downward */
    .row :global(.arrow) {
      align-self: center;
      transform: rotate(90deg);
      flex-shrink: 0;
    }

    /* Outbounds tile: full width, reset min-height */
    .outbounds {
      width: 100%;
      min-height: unset;
      box-sizing: border-box;
    }

    /* Outbounds grid: single column on very narrow viewports */
    @media (max-width: 400px) {
      .outbounds-grid {
        grid-template-columns: 1fr;
      }
      .ob-more {
        grid-column: span 1;
      }
    }
  }
</style>
