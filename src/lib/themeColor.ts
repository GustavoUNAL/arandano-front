const DEFAULT_DARK = '#161114'
const DEFAULT_LIGHT = '#f6f6f4'

export function setThemeColor(color: string) {
  let meta = document.querySelector('meta[name="theme-color"]')
  if (!meta) {
    meta = document.createElement('meta')
    meta.setAttribute('name', 'theme-color')
    document.head.appendChild(meta)
  }
  meta.setAttribute('content', color)
}

export function themeColorForScheme(theme: 'dark' | 'light') {
  return theme === 'light' ? DEFAULT_LIGHT : DEFAULT_DARK
}
