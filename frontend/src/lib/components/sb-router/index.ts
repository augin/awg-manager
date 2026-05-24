export { default as ServiceTile } from './ServiceTile.svelte';
export type { ServiceTileSize } from './ServiceTile.svelte';
export { default as PageShell } from './PageShell.svelte';
export type { EngineStatus } from './PageShell.svelte';
export { mode, setMode, type RouterMode } from './modeStore';
export { default as RuleCard } from './RuleCard.svelte';
export { default as MatcherChip } from './MatcherChip.svelte';
export { default as OutboundTile } from './OutboundTile.svelte';
export { default as RulesPanel } from './RulesPanel.svelte';
export type {
  RuleAction,
  MatcherKind,
  MatcherChip as MatcherChipData,
  OutboundKind,
  OutboundDisplay,
  RuleCardData,
} from './types';

// F3 — StatusDrawer
export { default as StatusDrawer } from './StatusDrawer.svelte';
export { drawerOpen, openDrawer, closeDrawer, toggleDrawer } from './drawerStore';
export { default as DrawerSection } from './DrawerSection.svelte';
export { default as DrawerRow } from './DrawerRow.svelte';
export { default as DepRow } from './DepRow.svelte';
export { default as IssueRow } from './IssueRow.svelte';
export type { DepTone, DepEntry, IssueTone, IssueEntry } from './drawerData';
export { deriveDeps, deriveIssues } from './drawerData';

// F4a — FlowGraph hero
export { default as FlowGraph } from './FlowGraph.svelte';
export { default as FlowStation } from './FlowStation.svelte';
export type { FlowStationTone } from './FlowStation.svelte';
export { default as FlowArrow } from './FlowArrow.svelte';
export { deriveOutboundList, type FlowOutbound, type FlowOutboundTone } from './flowData';

// F4b — Trace Screen
export { default as TracePanel } from './TracePanel.svelte';
export { default as TracePathStation } from './TracePathStation.svelte';
export type { TracePathTone } from './TracePathStation.svelte';
export { default as TraceRuleRow } from './TraceRuleRow.svelte';
export {
  traceOpen,
  traceInput,
  traceResult,
  traceLoading,
  traceError,
  openTrace,
  closeTrace,
  runTrace,
  type TraceInput,
} from './traceStore';
