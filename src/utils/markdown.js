/**
 * Escape strings for Telegram MarkdownV2 to avoid "can't parse entities" errors.
 */
export function escMd(str) {
  if (!str) return '';
  // Escapes: _ * [ ] ( ) ~ ` > # + - = | { } . ! \
  return String(str).replace(/[_*[\]()~`>#+=|{}.!\\-]/g, '\\$&');
}
