<!--
  Источник дизайна: singbox-router/project/screens/MainBeginner.jsx
  (секция "MAIN: Routing rules as cards" + EmptyState для пустого случая)

  Reads singboxRouterStore: три отдельных readable — rules, ruleSets, outbounds
  (store НЕ имеет единого status-объекта, поля плоские).
  Маппит каждое правило через singboxRuleToCard в RuleCardData.
-->

<script lang="ts">
  import { singboxRouter as singboxRouterStore } from '$lib/stores/singboxRouter';
  import { SectionLabel } from '$lib/components/ui';
  import RuleCard from './RuleCard.svelte';
  import { singboxRuleToCard } from './adapters';
  import type { RuleCardData } from './types';

  const rules = singboxRouterStore.rules;
  const ruleSets = singboxRouterStore.ruleSets;
  const outbounds = singboxRouterStore.outbounds;

  // Собираем rulesetLabels: tag → tag (у SingboxRouterRuleSet нет поля label,
  // только tag — используем его как отображаемое имя)
  let rulesetLabels: Record<string, string> = $derived.by(() => {
    const labels: Record<string, string> = {};
    for (const rs of $ruleSets) {
      if (rs.tag) labels[rs.tag] = rs.tag;
    }
    return labels;
  });

  // Map raw rules → RuleCardData[]
  let cards: RuleCardData[] = $derived.by(() =>
    $rules.map((r, i) => singboxRuleToCard(r, i, $outbounds, rulesetLabels)),
  );

  let count = $derived(cards.length);

  function pluralRules(n: number): string {
    if (n === 1) return 'правило';
    if (n >= 2 && n <= 4) return 'правила';
    return 'правил';
  }
</script>

<section class="rules-panel">
  <header class="panel-header">
    <div class="title-group">
      <h2 class="title">Что и куда отправлять</h2>
      <p class="sub">Правила применяются сверху вниз. Срабатывает первое подходящее.</p>
    </div>
    <div class="counter">
      {count} {pluralRules(count)}
    </div>
  </header>

  {#if count === 0}
    <div class="empty">
      <SectionLabel>Пока нет правил</SectionLabel>
      <p class="empty-text">
        Создайте правило через <strong>Эксперт-режим</strong> → подвкладка «Rules».
        В будущих версиях здесь появится мастер создания.
      </p>
    </div>
  {:else}
    <div class="cards">
      {#each cards as card, i (card.id)}
        <RuleCard {card} index={i} />
      {/each}
    </div>
  {/if}
</section>

<style>
  .rules-panel {
    display: flex;
    flex-direction: column;
    gap: var(--sp-4);
  }

  .panel-header {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: var(--sp-4);
  }

  .title-group {
    min-width: 0;
    flex: 1;
  }

  .title {
    margin: 0;
    font-size: var(--fs-h4);
    font-weight: 600;
    color: var(--text-primary);
    line-height: var(--lh-tight);
  }

  .sub {
    margin: 4px 0 0;
    font-size: var(--fs-sm);
    color: var(--text-muted);
    line-height: var(--lh-body);
  }

  .counter {
    font-size: var(--fs-sm);
    color: var(--text-muted);
    flex-shrink: 0;
  }

  .cards {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .empty {
    padding: var(--sp-5) var(--sp-4);
    background: var(--bg-secondary);
    border: 1px dashed var(--border);
    border-radius: var(--radius);
    text-align: center;
  }

  .empty-text {
    margin: var(--sp-3) auto 0;
    max-width: 480px;
    font-size: var(--fs-sm);
    color: var(--text-secondary);
    line-height: var(--lh-body);
  }
</style>
