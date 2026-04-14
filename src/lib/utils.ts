import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combina clases cifradas de Tailwind usando clsx y tailwind-merge.
 * Es esencial para manejar conflictos de clases en componentes reutilizables.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
