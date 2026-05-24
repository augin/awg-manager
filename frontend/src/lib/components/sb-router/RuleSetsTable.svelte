<!--
  Источник дизайна: singbox-router/project/screens/MainExpert.jsx (RuleSetsTable + segment filter)
-->

<script lang="ts">
  import type { SingboxRouterRuleSet } from '$lib/types';
  import { Badge } from '$lib/components/ui';
  import { Edit3, Trash2 } from 'lucide-svelte';

  type RsFilter = 'all' | 'remote' | 'local' | 'inline';

  interface Props {
    ruleSets: SingboxRouterRuleSet[];
    onEdit: (tag: string) => void;
    onDelete: (tag: string) => void;
  }

  let { ruleSets, onEdit, onDelete }: Props = $props();

  let filter = $state<RsFilter>('all');

  const filtered = $derived.by(() => {
    if (filter === 'all') return ruleSets;
    return ruleSets.filter((rs) => (rs.type ?? 'remote') === filter);
  });

  function typeVariant(t?: string): 'accent' | 'info' | 'warning' {
    if (t === 'local') return 'info';
    if (t === 'inline') return 'warning';
    return 'accent';
  }

  function sourceFor(rs: SingboxRouterRuleSet): string {
    if (rs.type === 'remote') return rs.url ?? '—';
    if (rs.type === 'local') return rs.path ?? '—';
    if (rs.type === 'inline') return `${rs.rules?.length ?? 0} rules`;
    return '—';
  }
</script>

<div class="wrap">
  <div class="segment-row">
    <div class="seg" role="tablist">
      {#each [{ k: 'all', l: 'Все' }, { k: 'remote', l: 'Remote' }, { k: 'local', l: 'Local' }, { k: 'inline', l: 'Inline' }] as opt (opt.k)}
        <button
          type="button"
          class="chip"
          class:active={filter === opt.k}
          onclick={() => (filter = opt.k as RsFilter)}
        >
          {opt.l}
        </button>
      {/each}
    </div>
  </div>

  <div class="table">
    <div class="header">
      <div>Tag</div>
      <div>Тип</div>
      <div>Источник</div>
      <div>Detour</div>
      <div class="actions-col">Действия</div>
    </div>
    {#each filtered as rs (rs.tag)}
      <div class="row">
        <div class="tag">{rs.tag}</div>
        <div>
          <Badge variant={typeVariant(rs.type)} size="sm" mono>{rs.type ?? 'remote'}</Badge>
        </div>
        <div class="source" title={sourceFor(rs)}>{sourceFor(rs)}</div>
        <div class="detour">{rs.download_detour ?? '—'}</div>
        <div class="actions-col actions">
          <button type="button" class="icon-btn" title="Редактировать" onclick={() => onEdit(rs.tag)}>
            <Edit3 size={12} />
          </button>
          <button type="button" class="icon-btn danger" title="Удалить" onclick={() => onDelete(rs.tag)}>
            <Trash2 size={12} />
          </button>
        </div>
      </div>
    {/each}
    {#if filtered.length === 0}
      <div class="empty">Нет наборов</div>
    {/if}
  </div>
</div>

<style>
  .wrap {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .segment-row {
    display: flex;
  }
  .seg {
    display: inline-flex;
    gap: 4px;
    padding: 3px;
    background: var(--bg-tertiary);
    border: 1px solid var(--border);
    border-radius: 999px;
  }
  .chip {
    padding: 4px 12px;
    border-radius: 999px;
    border: 0;
    background: transparent;
    color: var(--text-muted);
    font-size: 12px;
    font-family: inherit;
    cursor: pointer;
  }
  .chip.active {
    background: var(--accent);
    color: #fff;
    font-weight: 600;
  }
  .table {
    background: var(--bg-secondary);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    overflow: hidden;
  }
  .header, .row {
    display: grid;
    grid-template-columns: 160px 80px 1fr 100px 80px;
    padding: 7px 14px;
    align-items: center;
    gap: 8px;
  }
  .header {
    background: var(--bg-tertiary);
    border-bottom: 1px solid var(--border);
    padding: 8px 14px;
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--text-muted);
    font-weight: 500;
  }
  .row {
    border-bottom: 1px solid rgba(255, 255, 255, 0.04);
    font-size: 12.5px;
  }
  .tag {
    font-family: var(--font-mono);
    font-weight: 600;
  }
  .source {
    font-family: var(--font-mono);
    font-size: 11.5px;
    color: var(--text-muted);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .detour {
    font-family: var(--font-mono);
    font-size: 11.5px;
    color: var(--text-secondary);
  }
  .actions-col {
    text-align: right;
  }
  .actions {
    display: flex;
    justify-content: flex-end;
    gap: 2px;
  }
  .icon-btn {
    background: transparent;
    border: 0;
    color: var(--text-muted);
    cursor: pointer;
    padding: 4px;
    border-radius: var(--radius-sm);
    display: inline-flex;
  }
  .icon-btn:hover {
    color: var(--text-primary);
    background: var(--bg-tertiary);
  }
  .icon-btn.danger:hover {
    color: var(--color-error, #dc2626);
  }
  .empty {
    padding: 14px;
    color: var(--text-muted);
    text-align: center;
    font-size: 12px;
  }
  @media (max-width: 768px) {
    .table {
      overflow-x: auto;
    }
    .header, .row {
      min-width: 600px;
    }
  }
</style>
