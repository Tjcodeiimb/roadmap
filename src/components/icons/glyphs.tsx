import { IconBase, type IconProps } from "./icon-base";

export function StreakMark(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M12 2.6 C 13.2 6.2, 15.4 7.8, 16.8 10.2 A 6.4 6.4 0 1 1 7.2 10.2 C 8 8.8, 9.2 7.8, 9.8 6.4 C 10.4 8.2, 11 9, 12 9.6 C 12.8 7.4, 12.6 4.8, 12 2.6 Z" />
      <path d="M12 12.6 C 13 13.8, 13.6 14.5, 13.6 15.5 a 1.6 1.6 0 0 1 -3.2 0 C 10.4 14.5, 11 13.8, 12 12.6 Z" />
    </IconBase>
  );
}

export function TrophyMark(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M8 4.5 h8 v4 a4 4 0 0 1 -8 0 Z" />
      <path d="M8 6 H6.2 a2.4 2.4 0 0 0 2.4 3.7" />
      <path d="M16 6 h1.8 a2.4 2.4 0 0 1 -2.4 3.7" />
      <path d="M12 12.6 v4.2" />
      <path d="M8.8 19.4 h6.4" />
    </IconBase>
  );
}

export function SparkMark(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M12 3 L13.7 10.3 L21 12 L13.7 13.7 L12 21 L10.3 13.7 L3 12 L10.3 10.3 Z" />
    </IconBase>
  );
}

export function CheckMark(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M5 12.5 L10 17.3 L19 7" />
    </IconBase>
  );
}

export function CheckCircleMark(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="12" cy="12" r="8.6" />
      <path d="M8 12.2 L11 15.2 L16.2 9" />
    </IconBase>
  );
}

export function LockMark(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M7.2 10.8 h9.6 v8.4 h-9.6 Z" />
      <path d="M9.2 10.8 V8.2 a2.8 2.8 0 0 1 5.6 0 v2.6" />
    </IconBase>
  );
}

export function PlayMark(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M9.5 7.3 L17 12 L9.5 16.7 Z" />
    </IconBase>
  );
}

export function ExternalMark(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M14 4.2 h5.8 v5.8" />
      <path d="M19.8 4.2 L11.4 12.6" />
      <path d="M18 13.6 v5.4 a1.4 1.4 0 0 1 -1.4 1.4 H6 a1.4 1.4 0 0 1 -1.4 -1.4 V7.4 A1.4 1.4 0 0 1 6 6 h5.4" />
    </IconBase>
  );
}

export function RepeatMark(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M4.5 12 a7.5 7.5 0 0 1 12.8 -5.3" />
      <path d="M17.4 3.4 v3.5 h-3.5" />
      <path d="M19.5 12 a7.5 7.5 0 0 1 -12.8 5.3" />
      <path d="M6.6 20.6 v-3.5 h3.5" />
    </IconBase>
  );
}

export function ClockMark(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="12" cy="12" r="8.4" />
      <path d="M12 7.2 v5 l3.5 2.1" />
    </IconBase>
  );
}

export function MailMark(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M3.6 6.6 h16.8 v10.8 h-16.8 Z" />
      <path d="M3.6 7.1 L12 13.1 L20.4 7.1" />
    </IconBase>
  );
}

export function SignalMark(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M5 16 a7 7 0 0 1 14 0" />
      <path d="M8.2 16 a3.8 3.8 0 0 1 7.6 0" />
      <circle cx="12" cy="16" r="1.1" fill="currentColor" stroke="none" />
    </IconBase>
  );
}

export function BurstMark(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="12" cy="12" r="2.6" />
      <path d="M12 3 v2.6" />
      <path d="M12 18.4 v2.6" />
      <path d="M3 12 h2.6" />
      <path d="M18.4 12 h2.6" />
      <path d="M5.6 5.6 l1.9 1.9" />
      <path d="M16.5 16.5 l1.9 1.9" />
      <path d="M18.4 5.6 l-1.9 1.9" />
      <path d="M7.5 16.5 l-1.9 1.9" />
    </IconBase>
  );
}

export function BoltMark(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M13.5 3 L6.5 13.5 h4.2 l-1.2 7.5 L17.5 10.5 h-4.2 Z" />
    </IconBase>
  );
}

// Difficulty meter — all three bars raised reads as "this was hard".
export function EffortMark(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M6 19 v-3.6" />
      <path d="M12 19 v-7.6" />
      <path d="M18 19 v-11.6" />
    </IconBase>
  );
}

export function TargetMark(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="12" cy="12" r="8.4" />
      <circle cx="12" cy="12" r="4.4" />
      <circle cx="12" cy="12" r="1.1" fill="currentColor" stroke="none" />
    </IconBase>
  );
}

export function CompassMark(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="12" cy="12" r="8.4" />
      <path d="M15.2 8.8 L13.2 13.2 L8.8 15.2 L10.8 10.8 Z" />
    </IconBase>
  );
}

export function TrendMark(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M4 16.6 L9 11.6 L13 15.1 L20 7.2" />
      <path d="M15.6 7.2 h4.4 v4.4" />
    </IconBase>
  );
}

export function LinkMark(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M10.2 13.8 a3.6 3.6 0 0 0 5.1 0 l3-3 a3.6 3.6 0 0 0 -5.1 -5.1 l-1.2 1.2" />
      <path d="M13.8 10.2 a3.6 3.6 0 0 0 -5.1 0 l-3 3 a3.6 3.6 0 0 0 5.1 5.1 l1.2 -1.2" />
    </IconBase>
  );
}
