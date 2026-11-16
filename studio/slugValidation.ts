import type {SlugIsUniqueValidator} from '@sanity/types'

export const isUniqueContentSlug: SlugIsUniqueValidator = async (slug, context) => {
  const {document, getClient} = context
  if (!document?._id || !slug) return true
  const published = document._id.replace(/^drafts\./, '').replace(/^versions\.[^.]+\./, '')
  // Import backups do not own public URLs. Drafts of other documents still do.
  return getClient({apiVersion: '2026-11-03'}).withConfig({useCdn: false, perspective: 'raw'}).fetch<boolean>(
    `!defined(*[_type == $type && !defined(cmsMigrationTarget) && !sanity::versionOf($published) && slug.current == $slug][0]._id)`,
    {type: document._type, published, slug},
  )
}