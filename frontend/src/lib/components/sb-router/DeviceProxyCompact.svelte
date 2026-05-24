<!--
  Источник дизайна: singbox-router/project/screens/MainExpert.jsx (DeviceProxyCompact)
  Простой statics panel — в F6 показываем placeholder (полная функциональность через старую страницу до F8).
-->

<script lang="ts">
  import { Button } from '$lib/components/ui';
  import { ChevronRight } from 'lucide-svelte';

  interface Props {
    onConfigure: () => void;
  }

  let { onConfigure }: Props = $props();
</script>

{#snippet icon()}<ChevronRight size={12} />{/snippet}

<div class="panel">
  <span class="dot"></span>
  <div class="info">
    <div class="title">Прокси для устройств</div>
    <div class="sub">SOCKS5 / HTTP listeners — детали и статистика на старой странице</div>
  </div>
  <Button variant="ghost" size="sm" onclick={onConfigure} iconBefore={icon}>
    Настроить
  </Button>
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
    background: var(--color-success, #22c55e);
    flex-shrink: 0;
  }
  .info {
    flex: 1;
    min-width: 0;
  }
  .title {
    font-family: var(--font-mono);
    font-weight: 600;
    font-size: 13px;
  }
  .sub {
    font-size: 12px;
    color: var(--text-muted);
    margin-top: 2px;
  }
</style>
