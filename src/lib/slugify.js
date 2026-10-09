// Section ids for headings and in-page links. ʻ and macrons fold away so
// "The Past Particle *Sā*" becomes "the-past-particle-sa".
export function slugify(text) {
  return String(text ?? '')
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[‘’ʻ'`]/g, '')
    .replace(/[/.:,;—–]/g, ' ')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}
