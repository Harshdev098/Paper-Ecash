import type { Label } from "@/types/init.type"

export const labelConfig: Record<
  Label,
  {
    bg: string
    text: string
    hover: string
    selected:string
    icon: string
    tooltip: string
  }
> = {
  Community: {
    bg: 'bg-muted',
    text: 'text-green-700',
    hover: 'hover:bg-green-200',
    selected:'bg-green-200',
    icon: 'fa-brands fa-connectdevelop',
    tooltip: 'Community edition',
  },
  Event: {
    bg: 'bg-muted',
    text: 'text-sky-700',
    hover: 'hover:bg-sky-200',
    selected:'bg-sky-200',
    icon: 'fa-regular fa-calendar-check',
    tooltip: 'Bitcoin Event/Summit',
  },
  Gifts: {
    bg: 'bg-muted',
    text: 'text-red-700',
    hover: 'hover:bg-red-200',
    selected:'bg-red-200',
    icon: 'fa-solid fa-gift',
    tooltip: 'Gifts & Celebration',
  },
  Cypherpunk: {
    bg: 'bg-muted',
    text: 'text-purple-700',
    hover: 'hover:bg-purple-200',
    selected:'bg-purple-200',
    icon: 'fa-solid fa-user-lock',
    tooltip: 'Privacy focused',
  },
  Other: {
    bg: 'bg-muted',
    text: 'text-gray-700',
    hover: 'hover:bg-gray-200',
    selected:'bg-gray-200',
    icon: 'fa-solid fa-layer-group',
    tooltip: 'Other category',
  },
  Regular: {
    bg: 'bg-muted',
    text: 'text-yellow-700',
    hover: 'hover:bg-yellow-200',
    selected:'bg-yellow-200',
    icon: 'fa-solid fa-star',
    tooltip: 'Regular design',
  },
}