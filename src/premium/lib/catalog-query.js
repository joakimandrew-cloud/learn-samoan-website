export function matchesDrill(drill, query) {
  const needle = query.trim().toLocaleLowerCase()
  if (!needle) return true
  const where = drill.ch == null ? ['every chapter'] : [`chapter ${drill.ch}`, `ch ${drill.ch}`]
  return [drill.title, drill.blurb, drill.action, ...where]
    .some(value => String(value ?? '').replace(/\*/g, '').toLocaleLowerCase().includes(needle))
}

export function filterDrillGroups(groups, query = '', level = 'all') {
  return groups.map(group => ({
    ...group,
    visible: group.drills.filter(drill => (
      (level === 'all' || drill.level === level) && matchesDrill(drill, query)
    )),
  }))
}
