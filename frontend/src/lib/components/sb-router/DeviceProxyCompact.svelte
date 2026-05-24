<!--
  Источник дизайна: singbox-router/project/screens/MainExpert.jsx (DeviceProxyCompact)
  Full implementation reading DeviceProxyConfig + Runtime + Instances + IPCheck.
-->

<script lang="ts">
  import { onMount } from 'svelte';
  import { Button, Badge } from '$lib/components/ui';
  import { ChevronRight } from 'lucide-svelte';
  import { api } from '$lib/api/client';
  import type {
    DeviceProxyConfig,
    DeviceProxyRuntime,
    DeviceProxyInstance,
  } from '$lib/types';

  interface Props {
    onConfigure: () => void;
    bare?: boolean;
  }

  let { onConfigure, bare = false }: Props = $props();

  let config = $state<DeviceProxyConfig | null>(null);
  let runtime = $state<DeviceProxyRuntime | null>(null);
  let instances = $state<DeviceProxyInstance[]>([]);
  let loadError = $state<string | null>(null);

  onMount(async () => {
    try {
      const [c, r, ins] = await Promise.all([
        api.getDeviceProxyConfig(),
        api.getDeviceProxyRuntime(),
        api.listDeviceProxyInstances(),
      ]);
      config = c;
      runtime = r;
      instances = ins;
    } catch (e) {
      loadError = e instanceof Error ? e.message : String(e);
    }
  });

  const dotTone = $derived(
    !config ? 'muted'
    : !config.enabled ? 'muted'
    : runtime?.alive ? 'success'
    : 'error',
  );

  const listenLabel = $derived.by(() => {
    if (!config) return '—';
    const host = config.listenAll ? '0.0.0.0' : (config.listenInterface || 'auto');
    return `${host}:${config.port}`;
  });

  function pluralListeners(n: number): string {
    if (n === 1) return 'listener';
    if (n >= 2 && n <= 4) return 'listener\'а';
    return 'listener\'ов';
  }
</script>

{#snippet icon()}<ChevronRight size={12} />{/snippet}

<div class="panel" class:bare>
  <span class="dot" data-tone={dotTone}></span>
  <div class="info">
    {#if config}
      <div class="title">
        {config.enabled ? 'Прокси для устройств активен' : 'Прокси для устройств отключён'}
      </div>
      <div class="sub">
        <span class="mono">{listenLabel}</span> ·
        через <Badge variant="accent" size="sm" mono>{config.selectedOutbound || '—'}</Badge> ·
        {instances.length} {pluralListeners(instances.length)}
      </div>
    {:else if loadError}
      <div class="title">Не удалось загрузить</div>
      <div class="sub error">{loadError}</div>
    {:else}
      <div class="title">Загрузка...</div>
      <div class="sub">device proxy</div>
    {/if}
  </div>
  {#if runtime && runtime.alive && runtime.activeTag}
    <div class="runtime">
      <Badge variant="success" size="sm" mono>active: {runtime.activeTag}</Badge>
    </div>
  {/if}
  {#if !bare}
    <Button variant="ghost" size="sm" onclick={onConfigure} iconBefore={icon}>
      Настроить
    </Button>
  {/if}
</div>

<style>
  .panel {
    background: var(--bg-secondary);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 14px;
    display: flex;
    align-items: center;
    gap: 14px;
  }
  .dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--text-muted);
    flex-shrink: 0;
  }
  .dot[data-tone='success'] {
    background: var(--color-success, #22c55e);
  }
  .dot[data-tone='error'] {
    background: var(--color-error, #dc2626);
  }
  .info {
    flex: 1;
    min-width: 0;
  }
  .title {
    font-weight: 600;
    font-size: 13px;
    color: var(--text-primary);
  }
  .sub {
    font-size: 12px;
    color: var(--text-muted);
    margin-top: 2px;
    display: flex;
    align-items: center;
    gap: 6px;
    flex-wrap: wrap;
  }
  .sub.error {
    color: var(--color-error, #dc2626);
  }
  .mono {
    font-family: var(--font-mono);
    color: var(--text-secondary);
  }
  .runtime {
    flex-shrink: 0;
  }
  @media (max-width: 768px) {
    .panel {
      flex-direction: column;
      align-items: stretch;
    }
    .sub {
      gap: 4px;
    }
  }
  /* Bare mode для embed внутри SidePanel — без double chrome */
  .panel.bare {
    background: transparent;
    border: 0;
    border-radius: 0;
    padding: 12px 14px;
  }
</style>
