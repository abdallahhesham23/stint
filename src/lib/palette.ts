// Subject identity colours (docs/design/system.md §1): stored as keys, drawn via CSS variables per theme.
export const SUBJECT_COLORS = ['ocean', 'moss', 'amber', 'rose', 'rust', 'slate', 'sand', 'charcoal'] as const

export const colorVar = (key: string) => `var(--subj-${SUBJECT_COLORS.includes(key as never) ? key : 'slate'})`
