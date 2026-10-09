import { useEffect } from 'react'
import { COURSE_NAME } from '@app/lib/course.js'
import { HOME_TITLE } from '@app/lib/site-meta.js'

export function useTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} · ${COURSE_NAME}` : HOME_TITLE
  }, [title])
}
