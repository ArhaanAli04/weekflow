interface BadgeProps {
  label: string;
  /** Hex color string — used for text and tinted background. Inline style is intentional: color is a runtime value Tailwind cannot resolve statically. */
  color: string;
}

export default function Badge({ label, color }: BadgeProps) {
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
      style={{ backgroundColor: `${color}26`, color }}
    >
      {label}
    </span>
  );
}
