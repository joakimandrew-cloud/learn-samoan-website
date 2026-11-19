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

  // The dictionary as a defined term set; every word page's DefinedTerm points here.
  const termSet = {
    '@type': 'DefinedTermSet',
    '@id': `${url('/dictionary')}#termset`,
    name: `${SITE_NAME} Dictionary`,
    url: url('/dictionary'),
    inLanguage: 'en',
    isPartOf: { '@id': SITE_ID },
  }

  const graph = nodes => ({ '@context': 'https://schema.org', '@graph': nodes.filter(Boolean) })

  /** route: { path, title, description, kind, chapter?, name? } */
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
      // A topic page teaches one subject in full, so it carries the shape a chapter does.
      case 'topic':
        return graph([
          organization, website, course(path),
          {
            '@type': 'LearningResource',
            '@id': `${self}#article`,
            name: route.name,
            description,
            url: self,
            inLanguage: 'en',
            teaches: 'Sāmoan language',
            learningResourceType: 'Article',
            about,
            isPartOf: { '@id': COURSE_ID },
            provider: { '@id': ORG_ID },
          },
          breadcrumb([home, { name: 'Reference', path: '/reference' }, { name: route.name, path }]),
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
      case 'dictionary':
        return graph([
          organization, website,
          { '@type': 'WebPage', '@id': `${self}#webpage`, name: title, description, url: self, inLanguage: 'en', isPartOf: { '@id': SITE_ID } },
          termSet,
          breadcrumb([home, { name: 'Dictionary', path }]),
        ])
      case 'word':
        return graph([
          organization, website, termSet,
          ...route.page.entries.map(entry => ({
            '@type': 'DefinedTerm',
            '@id': `${self}#${entry.id}`,
            name: entry.display,
            description: plain(entry.english),
            url: self,
            inDefinedTermSet: { '@id': termSet['@id'] },
          })),
          breadcrumb([home, { name: 'Dictionary', path: '/dictionary' }, { name: route.page.words.join(', '), path }]),
        ])
      case 'english':
        return graph([
          organization, website,
          breadcrumb([home, { name: 'Dictionary', path: '/dictionary' }, { name: `How to say ${route.page.headword} in Sāmoan`, path }]),
        ])
      default:
        return graph([
          organization, website,
          { '@type': 'WebPage', '@id': `${self}#webpage`, name: title, description, url: self, inLanguage: 'en', isPartOf: { '@id': SITE_ID } },
        ])
    }
  }
}
