<script lang="ts" module>
  export type ServiceTileSize = 'sm' | 'md' | 'lg';
</script>

<script lang="ts">
  import { getServiceVisual } from '$lib/data/services';

  interface Props {
    /** Service key — резолвится через services.ts; неизвестное → custom fallback. */
    serviceKey: string;
    /** Подпись справа от тайла (имя сервиса). */
    name?: string;
    /** Опциональный subтекст под именем. */
    sub?: string;
    /** Размер тайла. sm=24, md=32 (default), lg=40. */
    size?: ServiceTileSize;
  }

  let { serviceKey, name, sub, size = 'md' }: Props = $props();
  let visual = $derived(getServiceVisual(serviceKey));
  let dim = $derived(size === 'sm' ? 24 : size === 'lg' ? 40 : 32);
  let fontSize = $derived(size === 'sm' ? 11 : size === 'lg' ? 16 : 14);
</script>

<div class="service-tile">
  <div
    class="glyph"
    style:width="{dim}px"
    style:height="{dim}px"
    style:background={visual.color}
    style:font-size="{fontSize}px"
  >{visual.glyph}</div>
  {#if name}
    <div class="text">
      <div class="name">{name}</div>
      {#if sub}<div class="sub">{sub}</div>{/if}
    </div>
  {/if}
</div>

<style>
  .service-tile {
    display: inline-flex;
    align-items: center;
    gap: var(--sp-3);
    min-width: 0;
  }
  .glyph {
    flex-shrink: 0;
    border-radius: var(--radius-sm);
    color: #fff;
    font-weight: 700;
    font-family: var(--font-sans);
    display: flex;
    align-items: center;
    justify-content: center;
    line-height: 1;
  }
  .text { min-width: 0; line-height: 1.2; }
  .name {
    font-weight: 600;
    font-size: var(--fs-base);
    color: var(--text-primary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .sub {
    font-size: var(--fs-xs);
    color: var(--text-muted);
    margin-top: 2px;
  }
</style>
