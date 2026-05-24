<script lang="ts" module>
  import type { Snippet } from 'svelte';
  export type EngineStatus = 'ok' | 'down' | 'unknown' | 'warning';
</script>

<script lang="ts">
  import { mode, setMode, type RouterMode } from './modeStore';
  import { openDrawer } from './drawerStore';
  import { Badge } from '$lib/components/ui';
  import StatusDrawer from './StatusDrawer.svelte';

  interface Props {
    /** Текущий статус движка sing-box. Влияет только на цвет pill. */
    engineStatus?: EngineStatus;
    /** Дополнительный subtitle под title (опционально). */
    subtitle?: string;
    /** Дочерний контент страницы. */
    children: Snippet;
  }

  let { engineStatus = 'unknown', subtitle, children }: Props = $props();
  let currentMode = $derived($mode);

  const STATUS_LABEL: Record<EngineStatus, string> = {
    ok: 'Engine OK',
    down: 'Engine не работает',
    warning: 'Engine ошибки',
    unknown: 'Engine —',
  };

  const STATUS_VARIANT: Record<EngineStatus, 'success' | 'error' | 'warning' | 'muted'> = {
    ok: 'success',
    down: 'error',
    warning: 'warning',
    unknown: 'muted',
  };

  function selectMode(next: RouterMode) {
    setMode(next);
  }
</script>

<div class="sb-shell">
  <header class="sb-header">
    <div class="title-block">
      <h1 class="title">Маршрутизация · sing-box</h1>
      {#if subtitle}<div class="subtitle">{subtitle}</div>{/if}
    </div>

    <div class="status-slot">
      <button type="button" class="pill-button" onclick={openDrawer} aria-label="Открыть состояние">
        <Badge variant={STATUS_VARIANT[engineStatus]} size="md">
          {STATUS_LABEL[engineStatus]}
        </Badge>
      </button>
    </div>

    <div class="mode-toggle" role="tablist" aria-label="Режим интерфейса">
      <button
        type="button"
        role="tab"
        aria-selected={currentMode === 'beginner'}
        class:active={currentMode === 'beginner'}
        onclick={() => selectMode('beginner')}
      >Простой</button>
      <button
        type="button"
        role="tab"
        aria-selected={currentMode === 'expert'}
        class:active={currentMode === 'expert'}
        onclick={() => selectMode('expert')}
      >Эксперт</button>
    </div>
  </header>

  <div class="sb-body">
    {@render children()}
  </div>
</div>

<StatusDrawer />

<style>
  .sb-shell { display: flex; flex-direction: column; gap: var(--sp-4); }

  .sb-header {
    display: flex;
    align-items: center;
    gap: var(--sp-4);
    padding: var(--sp-3) 0;
    border-bottom: 1px solid var(--border);
    flex-wrap: wrap;
  }

  .title-block { flex: 1 1 auto; min-width: 0; }
  .title {
    margin: 0;
    font-size: var(--fs-h3);
    font-weight: 600;
    color: var(--text-primary);
    line-height: var(--lh-tight);
  }
  .subtitle {
    margin-top: 2px;
    font-size: var(--fs-sm);
    color: var(--text-muted);
  }

  .status-slot { flex-shrink: 0; }

  .mode-toggle {
    display: inline-flex;
    padding: 3px;
    gap: 2px;
    background: var(--bg-tertiary);
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    flex-shrink: 0;
  }
  .mode-toggle button {
    border: 0;
    border-radius: 4px;
    padding: 6px 14px;
    font-size: var(--fs-md);
    font-weight: 500;
    font-family: inherit;
    cursor: pointer;
    background: transparent;
    color: var(--text-secondary);
    transition: all var(--t-fast);
  }
  .mode-toggle button.active {
    background: var(--bg-hover);
    color: var(--text-primary);
    font-weight: 600;
    box-shadow: inset 0 0 0 1px var(--accent-line);
  }

  .sb-body { width: 100%; }

  .pill-button {
    background: none;
    border: 0;
    padding: 0;
    cursor: pointer;
    font: inherit;
    color: inherit;
    border-radius: var(--radius-sm);
    transition: opacity var(--t-fast);
  }
  .pill-button:hover { opacity: 0.85; }
  .pill-button:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
  }
</style>
