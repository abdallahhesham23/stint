import {
  Atom,
  BookOpen,
  Brain,
  Calculator,
  ChartLine,
  Code,
  Dna,
  FlaskConical,
  Globe,
  Landmark,
  Languages,
  Music,
  Palette,
  PenLine,
  Scale,
  Sigma,
  type LucideIcon,
} from 'lucide-react'

export const SUBJECT_ICONS: Record<string, LucideIcon> = {
  'book-open': BookOpen,
  calculator: Calculator,
  sigma: Sigma,
  'flask-conical': FlaskConical,
  atom: Atom,
  dna: Dna,
  brain: Brain,
  code: Code,
  'chart-line': ChartLine,
  globe: Globe,
  languages: Languages,
  'pen-line': PenLine,
  landmark: Landmark,
  scale: Scale,
  palette: Palette,
  music: Music,
}

export function SubjectIcon({ icon, size = 16, color }: { icon: string; size?: number; color?: string }) {
  const Icon = SUBJECT_ICONS[icon] ?? BookOpen
  return <Icon size={size} strokeWidth={1.75} color={color} aria-hidden="true" className="shrink-0" />
}
