/**
 * Los segmentos de URL llegan codificados (ej. "Hide%20on%20bush").
 * En Next 16 los params dinámicos NO se decodifican solos, así que hay que
 * decodificar una vez antes de volver a codificar para la API de Riot.
 *
 * Si el valor ya viniera decodificado, decodeURIComponent lo deja igual.
 */
export function decodeParam(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    // Un '%' suelto rompe decodeURIComponent: nos quedamos con el original.
    return value;
  }
}
