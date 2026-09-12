import {
  Briefcase,
  Car,
  CreditCard,
  Film,
  Home,
  Landmark,
  ShoppingBag,
  Utensils,
  type LucideIcon,
} from "lucide-react";

export function getCategoryIcon(category: string): { icon: LucideIcon; bg: string } {
  const cat = category.toLowerCase();

  if (cat.includes("loan") || cat.includes("mortgage")) {
    return { icon: Landmark, bg: "bg-amber-50 text-amber-700 ring-amber-200/60" };
  }

  if (cat.includes("dining") || cat.includes("food") || cat.includes("restaurant")) {
    return { icon: Utensils, bg: "bg-amber-50 text-amber-700 ring-amber-200/60" };
  }

  if (cat.includes("grocer") || cat.includes("market")) {
    return { icon: ShoppingBag, bg: "bg-emerald-50 text-emerald-700 ring-emerald-200/60" };
  }

  if (cat.includes("transport") || cat.includes("car") || cat.includes("gas") || cat.includes("uber")) {
    return { icon: Car, bg: "bg-sky-50 text-sky-700 ring-sky-200/60" };
  }

  if (cat.includes("house") || cat.includes("util") || cat.includes("rent")) {
    return { icon: Home, bg: "bg-indigo-50 text-indigo-700 ring-indigo-200/60" };
  }

  if (cat.includes("entertain") || cat.includes("stream") || cat.includes("movie")) {
    return { icon: Film, bg: "bg-purple-50 text-purple-700 ring-purple-200/60" };
  }

  if (cat.includes("income") || cat.includes("salary") || cat.includes("deposit")) {
    return { icon: Briefcase, bg: "bg-teal-50 text-teal-700 ring-teal-200/60" };
  }

  return { icon: CreditCard, bg: "bg-slate-100 text-slate-700 ring-slate-200/60" };
}
