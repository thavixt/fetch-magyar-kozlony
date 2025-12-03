const SPECIAL_CHARS_REGEXP = new RegExp(/[^\w\s]/, "g");

export function snakeCase(text: string) {
  return text
    .replaceAll(SPECIAL_CHARS_REGEXP, "")
    .replaceAll(" ", "_")
    .toLowerCase();
}
