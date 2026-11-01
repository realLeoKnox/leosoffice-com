// Use the first supported browser preference. No IP guessing or automatic redirects.
export function preferredLocale(languages) {
  for (const raw of languages) {
    const tag = String(raw).toLowerCase().replaceAll('_', '-');
    if (/^zh(?:-|$)/.test(tag)) {
      if (tag.includes('-hant')) return 'zh-Hant';
      if (tag.includes('-hans')) return 'zh-Hans';
      if (/^zh-(tw|hk|mo)(?:-|$)/.test(tag)) return 'zh-Hant';
      return 'zh-Hans';
    }
    if (/^en(?:-|$)/.test(tag)) return 'en';
  }
  return 'en';
}
