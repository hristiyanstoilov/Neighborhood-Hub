import type { LucideIcon } from 'lucide-react'
import {
  Bell,
  Calendar,
  CheckCircle2,
  ClipboardList,
  HandHeart,
  Hammer,
  Heart,
  Lightbulb,
  Leaf,
  Map,
  MessageCircle,
  PackageCheck,
  PackageX,
  Soup,
  Target,
  Rocket,
  User,
  RefreshCcw,
  Wrench,
  XCircle,
} from 'lucide-react'

export type AppIconName =
  | 'bell'
  | 'skills'
  | 'tools'
  | 'events'
  | 'drives'
  | 'food'
  | 'radar'
  | 'requests'
  | 'reservations'
  | 'profile'
  | 'message'
  | 'idea'
  | 'refresh'
  | 'rocket'
  | 'check'
  | 'close'
  | 'cancel'
  | 'complete'
  | 'return'
  | 'pledge'
  | 'target'

const ICONS: Record<AppIconName, LucideIcon> = {
  bell: Bell,
  skills: Hammer,
  tools: Wrench,
  events: Calendar,
  drives: Heart,
  food: Soup,
  radar: Map,
  requests: ClipboardList,
  reservations: PackageCheck,
  profile: User,
  message: MessageCircle,
  idea: Lightbulb,
  refresh: RefreshCcw,
  rocket: Rocket,
  check: CheckCircle2,
  close: XCircle,
  cancel: PackageX,
  complete: Leaf,
  return: PackageCheck,
  pledge: HandHeart,
  target: Target,
}

type AppIconProps = {
  name: AppIconName
  size?: number
  className?: string
  ariaLabel?: string
}

export function AppIcon({ name, size = 18, className, ariaLabel }: AppIconProps) {
  const Icon = ICONS[name]

  if (ariaLabel) {
    return <Icon size={size} className={className} aria-label={ariaLabel} />
  }

  return <Icon size={size} className={className} aria-hidden="true" />
}
