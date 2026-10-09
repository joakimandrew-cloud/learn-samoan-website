import { useEffect } from 'react'
import { COURSE_NAME } from '@app/lib/course.js'

export function useTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} · ${COURSE_NAME}` : `${COURSE_NAME} · Learn Samoan, free`
  }, [title])
}
