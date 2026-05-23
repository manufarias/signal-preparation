export function parseMedicationDisplay(display: string): {
  name: string;
  dose: string | null;
  form: string | null;
} {
  function capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  const clean = display.match(
    /^([A-Za-z\s]+?)\s+(\d+[\d.]*\s*(?:MG|MCG|ML|IU))\s+(.+)$/i,
  );
  if (clean)
    return {
      name: capitalize(clean[1].trim()),
      dose: clean[2].trim(),
      form: clean[3].trim(),
    };

  const pack = display.match(/\(([^)]+(?:MG|MCG|ML|IU)[^)]*)\)/i);
  if (pack) return parseMedicationDisplay(pack[1].trim());

  const er = display.match(
    /(?:\d+\s*HR\s+)?([A-Za-z][A-Za-z\s]+?)\s+(\d+[\d.]*\s*(?:MG|MCG|ML|IU))/i,
  );
  if (er)
    return { name: capitalize(er[1].trim()), dose: er[2].trim(), form: null };

  const firstWords = display.split(/\s+/).slice(0, 3).join(" ");
  return { name: capitalize(firstWords), dose: null, form: null };
}
