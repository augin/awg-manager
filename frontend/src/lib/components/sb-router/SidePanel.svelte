<!--
  Источник дизайна: singbox-router/project/screens/MainExpert.jsx (SidePanel)
-->

<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    title: string;
    count?: string;
    actionLabel?: string;
    onAction?: () => void;
    /** Если задан — заменяет одиночную кнопку (для множественных actions). */
    actions?: Snippet;
    children: Snippet;
  }

  let { title, count, actionLabel, onAction, actions, children }: Props = $props();
</script>

<div class="panel">
  <header class="head">
    <div class="left">
      <span class="title">{title}</span>
      {#if count}<span class="count">· {count}</span>{/if}
    </div>
    <div class="actions">
      {#if actions}
        {@render actions()}
      {:else if actionLabel && onAction}
        <button type="button" class="action" onclick={onAction}>{actionLabel}</button>
      {/if}
    </div>
  </header>
  <div class="body">
    {@render children()}
  </div>
</div>

<style>
  .panel {
    background: var(--bg-secondary);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    overflow: hidden;
  }
  .head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 14px;
    border-bottom: 1px solid var(--border);
    background: var(--bg-tertiary);
  }
  .left {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .title {
    font-weight: 600;
    font-size: 13px;
    color: var(--text-primary);
  }
  .count {
    font-size: 11px;
    color: var(--text-muted);
    font-family: var(--font-mono);
  }
  .actions {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .action, :global(.panel .head .action) {
    background: transparent;
    border: 0;
    color: var(--accent);
    font-size: 11.5px;
    cursor: pointer;
    font-family: inherit;
    padding: 0;
  }
  .action:hover, :global(.panel .head .action:hover) {
    text-decoration: underline;
  }
</style>
