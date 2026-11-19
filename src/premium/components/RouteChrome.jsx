// Route-level chrome that lives inside the Router. Two jobs:
//
//   1. Head sync. The prerendered HTML carries the right <title> and meta
//      description for the URL the visitor landed on (scripts/prerender.mjs);
//      this keeps both right across client-side navigations. The strings come
//      from src/seo/meta.js, the module the prerender reads. A route the module
//      does not know (a drill item, an unknown address) is left to its page.
//   2. Visit counting. The first load is counted by GoatCounter's own script (written
//      into index.html when GOATCOUNTER_CODE is set), so the first location is
//      skipped here; every later path change is counted through window.goatcounter.
import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import chapters from '@app/data/chapters.json'
import { metaForPath } from '@app/seo/meta.js'

function setDescription(text) {
  let tag = document.querySelector('meta[name="description"]')
  if (!tag) {
    tag = document.createElement('meta')
    tag.setAttribute('name', 'description')
    document.head.appendChild(tag)
  }
  tag.setAttribute('content', text)
}

export default function RouteChrome() {
  const { pathname } = useLocation()
  const firstLoad = useRef(true)

  useEffect(() => {
    const meta = metaForPath(pathname, { chapters })
    if (meta) {
      document.title = meta.title
      setDescription(meta.description)
    }
    if (firstLoad.current) {
      firstLoad.current = false
      return
    }
    window.goatcounter?.count?.({ path: pathname })
  }, [pathname])

  return null
}
