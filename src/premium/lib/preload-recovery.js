// A stale deployment gets one reload per URL. If persistence is unavailable,
// leave the error uncancelled so the page's loading fallback can handle it.
export function recoverPreload(event) {
  try {
    const key = 'ls-preload-reload'
    const url = window.location.href
    if (window.sessionStorage.getItem(key) === url) return
    window.sessionStorage.setItem(key, url)
  } catch { return }
  event.preventDefault()
  window.location.reload()
}
