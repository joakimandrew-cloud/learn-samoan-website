import { useEffect } from 'react'
import { HOME_TITLE } from '@app/seo/meta.js'

// `title` is a full title as src/seo/meta.js builds it, tail included; a falsy
// title means the home title. RouteChrome sets the same strings on navigation.
export function useTitle(title) {
  useEffect(() => {
    document.title = title || HOME_TITLE
  }, [title])
}

// A page whose title depends on data the first bundle does not carry (the
// dictionary's word pages) sets its own title and description, from the same
// function the prerender uses (dictionaryPageMeta in src/seo/meta.js).
// RouteChrome leaves those paths alone because metaForPath() returns null for them.
export function usePageMeta(meta) {
  const title = meta?.title
  const description = meta?.description
  useEffect(() => {
    if (!title) return
    document.title = title
    if (!description) return
    let tag = document.querySelector('meta[name="description"]')
    if (!tag) {
      tag = document.createElement('meta')
      tag.setAttribute('name', 'description')
      document.head.appendChild(tag)
    }
    tag.setAttribute('content', description)
  }, [title, description])
}
