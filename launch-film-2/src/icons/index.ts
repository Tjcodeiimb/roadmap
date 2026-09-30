import type { ComponentType } from "react";
import type { IconProps } from "./icon-base";
import {
  StreakMark,
  TrophyMark,
  SparkMark,
  CheckMark,
  CheckCircleMark,
  LockMark,
  PlayMark,
  ExternalMark,
  RepeatMark,
  ClockMark,
  MailMark,
  SignalMark,
  BurstMark,
  BoltMark,
  EffortMark,
  TargetMark,
  CompassMark,
  TrendMark,
  LinkMark,
  StackMark,
} from "./glyphs";
import {
  CourseMark,
  ArticleMark,
  VideoMark,
  PracticeMark,
  WebMark,
  GuideMark,
} from "./formats";
import {
  AiMark,
  FinanceMark,
  ConsultingMark,
  ExcelMark,
  PsychologyMark,
  MarketingMark,
  DataMark,
  ProductMark,
  SalesMark,
} from "./domains";

export type { IconProps };
export { IconBase } from "./icon-base";
export * from "./levels";
export * from "./glyphs";
export * from "./formats";
export * from "./domains";

// Resolves `icon_key` values stored in the database (tracks, resources,
// skills, cohorts) to a component. Keys are stable strings — renaming one
// means a data migration, so prefer adding over renaming.
export const ICONS: Record<string, ComponentType<IconProps>> = {
  // formats
  course: CourseMark,
  article: ArticleMark,
  video: VideoMark,
  practice: PracticeMark,
  web: WebMark,
  guide: GuideMark,
  pdf: ArticleMark,
  playlist: VideoMark,
  // domains / tracks
  ai: AiMark,
  finance: FinanceMark,
  consulting: ConsultingMark,
  excel: ExcelMark,
  psychology: PsychologyMark,
  marketing: MarketingMark,
  data: DataMark,
  product: ProductMark,
  sales: SalesMark,
  // glyphs
  streak: StreakMark,
  trophy: TrophyMark,
  spark: SparkMark,
  check: CheckMark,
  "check-circle": CheckCircleMark,
  lock: LockMark,
  play: PlayMark,
  external: ExternalMark,
  repeat: RepeatMark,
  clock: ClockMark,
  mail: MailMark,
  signal: SignalMark,
  burst: BurstMark,
  bolt: BoltMark,
  effort: EffortMark,
  target: TargetMark,
  compass: CompassMark,
  trend: TrendMark,
  link: LinkMark,
  stack: StackMark,
};

/**
 * Fallback for an unrecognised or missing `icon_key`.
 *
 * Resolve icons by indexing the registry directly at the call site —
 * `const Icon = ICONS[key] ?? FALLBACK_ICON` — rather than through a helper
 * function. React's `static-components` lint rule rejects a component
 * produced by a function call during render, but accepts an object lookup.
 */
export const FALLBACK_ICON = LinkMark;
