/**
 * Páginas que se muestran en el paginador: una ventana alrededor de la actual,
 * con la primera y la última siempre visibles. `null` es la elipsis.
 */
export function pageItems(
  current: number,
  total: number,
): readonly (number | null)[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const items: (number | null)[] = [1];
  const from = Math.max(2, Math.min(current - 1, total - 4));
  const to = Math.min(total - 1, Math.max(current + 1, 5));
  if (from > 2) items.push(null);
  for (let page = from; page <= to; page++) items.push(page);
  if (to < total - 1) items.push(null);
  items.push(total);
  return items;
}
