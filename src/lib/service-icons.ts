import {
  Stethoscope, Bed, Microscope, HeartPulse, Baby, Home, ClipboardCheck,
  ShieldCheck, Globe, Clock, Search, Activity, Pill, Syringe, Heart,
  Eye, Ear, Brain, Bone, Hospital,
} from "lucide-react";

export const SERVICE_ICONS = {
  Stethoscope, Bed, Microscope, HeartPulse, Baby, Home, ClipboardCheck,
  ShieldCheck, Globe, Clock, Search, Activity, Pill, Syringe, Heart,
  Eye, Ear, Brain, Bone, Hospital,
} as const;

export type ServiceIconName = keyof typeof SERVICE_ICONS;
export const SERVICE_ICON_NAMES = Object.keys(SERVICE_ICONS) as ServiceIconName[];

export function ServiceIcon({ name, className }: { name: string; className?: string }) {
  const Icon = (SERVICE_ICONS as Record<string, typeof Stethoscope>)[name] ?? Stethoscope;
  return <Icon className={className} />;
}
