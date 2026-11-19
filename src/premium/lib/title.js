import { useEffect } from 'react'
import { HOME_TITLE } from '@app/seo/meta.js'

// `title` is a full title as src/seo/meta.js builds it, tail included; a falsy
// title means the home title. RouteChrome sets the same strings on navigation.
export function useTitle(title) {
  useEffect(() => {
    document.title = title || HOME_TITLE
  }, [title])
}
