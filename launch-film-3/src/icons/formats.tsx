import { IconBase, type IconProps } from "./icon-base";

// Resource-format marks. These replace the emoji previously stored in
// `resources.icon` (🎓 📄 🧪 🌐 📺 🧭).

export function CourseMark(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M12 4.6 L21.4 9 L12 13.4 L2.6 9 Z" />
      <path d="M6.6 10.9 v4.4 c0 1.7 2.4 3 5.4 3 s5.4 -1.3 5.4 -3 v-4.4" />
    </IconBase>
  );
}

export function ArticleMark(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M6 3.4 h7.6 L18 7.8 V20.6 H6 Z" />
      <path d="M13.6 3.4 v4.4 H18" />
      <path d="M9 12.6 h6" />
      <path d="M9 16.2 h6" />
    </IconBase>
  );
}

export function VideoMark(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M3.4 6.6 h17.2 v10.8 H3.4 Z" />
      <path d="M10.3 9.7 L15 12 L10.3 14.3 Z" />
    </IconBase>
  );
}

export function PracticeMark(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M9.9 3.6 h4.2" />
      <path d="M10.4 3.6 v5.2 L5.5 18 a1.6 1.6 0 0 0 1.4 2.4 h10.2 a1.6 1.6 0 0 0 1.4 -2.4 l-4.9 -9.2 V3.6" />
      <path d="M7.8 14.6 h8.4" />
    </IconBase>
  );
}

export function WebMark(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M3.5 12 h17" />
      <path d="M12 3.5 a6 8.5 0 0 1 0 17 a6 8.5 0 0 1 0 -17" />
    </IconBase>
  );
}

export function GuideMark(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M15.3 8.7 L13.3 13.3 L8.7 15.3 L10.7 10.7 Z" />
    </IconBase>
  );
}
