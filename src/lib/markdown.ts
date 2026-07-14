export function escapeMarkdown(value: string) {
  return value.replace(/([\\`*_{}\[\]()<>#+\-.!|])/g, "\\$1");
}

export function httpsMarkdownUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.toString() : "https://invalid.example";
  } catch {
    return "https://invalid.example";
  }
}
