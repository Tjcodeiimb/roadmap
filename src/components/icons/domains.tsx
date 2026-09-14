import { IconBase, type IconProps } from "./icon-base";

// One mark per track / skill domain. Each is a distinct silhouette so a
// course is recognisable at 18px in the sidebar and at 40px on a
// marketplace card.

export function AiMark(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="12" cy="12" r="2.4" />
      <circle cx="12" cy="4.8" r="1.8" />
      <circle cx="5.6" cy="16" r="1.8" />
      <circle cx="18.4" cy="16" r="1.8" />
      <path d="M12 9.6 V6.6" />
      <path d="M10.1 13.3 L7.2 15" />
      <path d="M13.9 13.3 L16.8 15" />
    </IconBase>
  );
}

export function FinanceMark(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M6 7.2 a6 2.6 0 1 0 12 0 a6 2.6 0 1 0 -12 0" />
      <path d="M6 7.2 v4.8 a6 2.6 0 0 0 12 0 V7.2" />
      <path d="M6 12 v4.8 a6 2.6 0 0 0 12 0 V12" />
    </IconBase>
  );
}

export function ConsultingMark(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M12 3.8 L20.5 19.6 H3.5 Z" />
      <path d="M7.6 12.6 h8.8" />
      <path d="M5.5 16.4 h13" />
    </IconBase>
  );
}

export function ExcelMark(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M3.8 4.6 h16.4 v14.8 H3.8 Z" />
      <path d="M3.8 9.5 h16.4" />
      <path d="M3.8 14.5 h16.4" />
      <path d="M9.3 4.6 v14.8" />
      <path d="M14.7 4.6 v14.8" />
      <circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none" />
    </IconBase>
  );
}

export function PsychologyMark(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="9.4" cy="12" r="5.6" />
      <circle cx="14.6" cy="12" r="5.6" />
    </IconBase>
  );
}

export function MarketingMark(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M3.6 5 H20.4 L14.4 12.4 V19.4 L9.6 17.2 V12.4 Z" />
    </IconBase>
  );
}

export function DataMark(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M3.8 19.2 L9 13.6 L13 15.8 L20.2 6.8" />
      <circle cx="9" cy="13.6" r="1.3" fill="currentColor" stroke="none" />
      <circle cx="13" cy="15.8" r="1.3" fill="currentColor" stroke="none" />
      <circle cx="20.2" cy="6.8" r="1.3" fill="currentColor" stroke="none" />
    </IconBase>
  );
}

export function ProductMark(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M12 3.6 L20.4 8 L12 12.4 L3.6 8 Z" />
      <path d="M3.6 12.2 L12 16.6 L20.4 12.2" />
      <path d="M3.6 16.2 L12 20.6 L20.4 16.2" />
    </IconBase>
  );
}

export function SalesMark(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M4.4 5.4 h15.2 v10 H12 l-4.4 3.6 v-3.6 H4.4 Z" />
      <path d="M8 11.4 l2.6 -2.6 l2.4 2.4 l3 -3" />
    </IconBase>
  );
}
