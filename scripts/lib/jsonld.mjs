// Structured data for every prerendered page: one @graph per page, with the nodes
// of Build-Spec part (c). Organization and WebSite carry the name and the address
// and nothing else (no founder, no sameAs, no logo that does not exist). No node
// carries offers, a price or isAccessibleForFree, in either direction. Each page's
// own node carries that page's own URL and description.
import { DEFAULT_DESCRIPTION, SITE_NAME, headingFor, plain } from '../../src/seo/meta.js'

export function createGraphs({ site, chapters }) {
  const ORG_ID = `${site}#organization`
  const SITE_ID = `${site}#website`
  const COURSE_ID = `${site}#course`
  const url = path => (path === '/' ? site : `${site}${path.slice(1)}`)

  const organization = { '@type': 'Organization', '@id': ORG_ID, name: SITE_NAME, url: site }
  const website = { '@type': 'WebSite', '@id': SITE_ID, name: SITE_NAME, url: site, inLanguage: 'en', publisher: { '@id': ORG_ID } }
  const about = { '@type': 'Language', name: 'Sāmoan' }

  // The course's landing page is the home page; elsewhere the Course node points at the chapter list.
  const course = path => ({
    '@type': 'Course',
    '@id': COURSE_ID,
    name: SITE_NAME,
    description: path === '/' ? DEFAULT_DESCRIPTION : `A ${chapters.length}-chapter Sāmoan course with worked examples, exercises, quizzes and flip cards.`,
    url: path === '/' ? site : url('/chapters'),
    inLanguage: 'en',
    teaches: 'Sāmoan language',
    about,
    provider: { '@id': ORG_ID },
  })

  const breadcrumb = trail => ({
    '@type': 'BreadcrumbList',
    itemListElement: trail.map((t, i) => ({ '@type': 'ListItem', position: i + 1, name: t.name, item: url(t.path) })),
  })

  const graph = nodes => ({ '@context': 'https://schema.org', '@graph': nodes.filter(Boolean) })

  /** route: { path, title, description, kind, chapter? } */
  return function graphFor(route) {
    const { path, title, description, kind } = route
    const self = url(path)
    const home = { name: 'Home', path: '/' }
    switch (kind) {
      case 'home':
        return graph([organization, website, course(path)])
      case 'chapters':
        return graph([
          organization, website, course(path),
          {
            '@type': 'ItemList',
            '@id': `${self}#list`,
            name: headingFor('/chapters'),
            url: self,
            numberOfItems: chapters.length,
            itemListElement: chapters.map(c => ({ '@type': 'ListItem', position: c.chapter, name: `Chapter ${c.chapter}: ${plain(c.title)}`, url: url(`/chapters/${c.chapter}`) })),
          },
          breadcrumb([home, { name: 'Chapters', path }]),
        ])
      case 'chapter':
        return graph([
          organization, website, course(path),
          {
            '@type': 'LearningResource',
            '@id': `${self}#chapter`,
            name: title,
            description,
            url: self,
            inLanguage: 'en',
            teaches: 'Sāmoan language',
            learningResourceType: 'Chapter',
            about,
            isPartOf: { '@id': COURSE_ID },
            provider: { '@id': ORG_ID },
          },
          breadcrumb([home, { name: 'Chapters', path: '/chapters' }, { name: `Chapter ${route.chapter}`, path }]),
        ])
      case 'quiz':
        return graph([
          organization, website,
          {
            '@type': 'Quiz',
            '@id': `${self}#quiz`,
            name: title,
            description,
            url: self,
            inLanguage: 'en',
            about,
            educationalAlignment: {
              '@type': 'AlignmentObject',
              alignmentType: 'assesses',
              targetName: `Chapter ${route.chapter}`,
              targetUrl: url(`/chapters/${route.chapter}`),
            },
            isPartOf: { '@id': COURSE_ID },
          },
          breadcrumb([home, { name: 'Quizzes', path: '/quizzes' }, { name: `Chapter ${route.chapter} Quiz`, path }]),
        ])
      case 'drill':
        return graph([
          organization, website,
          {
            '@type': 'LearningResource',
            '@id': `${self}#drill`,
            name: title,
            description,
            url: self,
            inLanguage: 'en',
            teaches: 'Sāmoan language',
            learningResourceType: 'Practice drill',
            about,
            isPartOf: { '@id': COURSE_ID },
            provider: { '@id': ORG_ID },
          },
          breadcrumb([home, { name: 'Drills', path: '/drills' }, { name: route.name, path }]),
        ])
      default:
        return graph([
          organization, website,
          { '@type': 'WebPage', '@id': `${self}#webpage`, name: title, description, url: self, inLanguage: 'en', isPartOf: { '@id': SITE_ID } },
        ])
    }
  }
}
