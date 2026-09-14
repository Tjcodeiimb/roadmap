import { IconBase, type IconProps } from "./icon-base";

// Level marks read as one system: complexity grows with rank. A point
// becomes a ring, then a triangle, and gains a side each level until the
// hexagon fills in with inner structure at the top two ranks.

export function Level1(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="12" cy="12" r="4" />
    </IconBase>
  );
}

export function Level2(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="12" cy="12" r="7.5" />
      <circle cx="12" cy="12" r="3.5" />
    </IconBase>
  );
}

export function Level3(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M12 4.5 L18.5 15.8 L5.5 15.8 Z" />
    </IconBase>
  );
}

export function Level4(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M12 4 L20 12 L12 20 L4 12 Z" />
    </IconBase>
  );
}

export function Level5(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M12 4 L19.6 9.5 L16.7 18.5 L7.3 18.5 L4.4 9.5 Z" />
    </IconBase>
  );
}

export function Level6(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M12 4 L18.9 8 L18.9 16 L12 20 L5.1 16 L5.1 8 Z" />
    </IconBase>
  );
}

export function Level7(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M12 4 L18.9 8 L18.9 16 L12 20 L5.1 16 L5.1 8 Z" />
      <circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none" />
    </IconBase>
  );
}

export function Level8(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M12 4 L18.9 8 L18.9 16 L12 20 L5.1 16 L5.1 8 Z" />
      <path d="M12 8 L15.5 10 L15.5 14 L12 16 L8.5 14 L8.5 10 Z" />
      <circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none" />
    </IconBase>
  );
}

export const LEVEL_ICONS = [
  Level1,
  Level2,
  Level3,
  Level4,
  Level5,
  Level6,
  Level7,
  Level8,
] as const;
