export type InteractiveVariant = 'solid' | 'ghost' | 'outline' | 'soft';

export type InteractiveColor =
  'primary' | 'success' | 'warning' | 'danger' | 'muted' | 'purple' | 'blue' | 'emerald' | 'teal';

export type InteractiveVariantProps = {
  variant?: InteractiveVariant;
  color?: InteractiveColor;
};
