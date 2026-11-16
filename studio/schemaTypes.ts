import {isUniqueContentSlug} from './slugValidation'
import {defineArrayMember, defineField, defineType} from 'sanity'

const richText = (name = 'body', title = 'Tekst') => defineField({
  name, title, type: 'array', of: [
    defineArrayMember({type: 'block', styles: [{title: 'Vanlig tekst', value: 'normal'}, {title: 'Overskrift', value: 'h2'}, {title: 'Underoverskrift', value: 'h3'}], marks: {
      decorators: [{title: 'Fet', value: 'strong'}, {title: 'Kursiv', value: 'em'}],
      annotations: [{name: 'link', type: 'object', title: 'Lenke', fields: [{name: 'href', type: 'string', title: 'Adresse', validation: Rule => Rule.required().custom(value => typeof value === 'string' && /^(https?:\/\/|mailto:|tel:|\/(?!\/)|#)/i.test(value) ? true : 'Bruk https://, mailto:, tel:, / eller #')}]}],
    }}),
    defineArrayMember({type: 'image', title: 'Bilde', options: {hotspot: true}, fields: [{name: 'alt', type: 'string', title: 'Beskriv bildet', validation: Rule => Rule.required()}, {name: 'caption', type: 'string', title: 'Bildetekst'}]}),
  ],
})
const title = () => defineField({name: 'title', title: 'Overskrift', type: 'string', validation: Rule => Rule.required()})
const slug = () => defineField({name: 'slug', title: 'Adresse på nettsiden', type: 'slug', options: {source: 'title', maxLength: 90, isUnique: isUniqueContentSlug}, validation: Rule => Rule.required()})
const image = () => defineField({name: 'image', title: 'Bilde', type: 'image', options: {hotspot: true}, fields: [{name: 'alt', type: 'string', title: 'Beskriv bildet', validation: Rule => Rule.required()}]})
const intro = () => defineField({name: 'intro', title: 'Kort innledning', type: 'text', rows: 3})
const order = () => defineField({name: 'order', title: 'Rekkefølge (lavest først)', type: 'number', initialValue: 10})

export const schemaTypes = [
  defineType({name: 'home', title: 'Forsiden', type: 'document', fields: [title(), intro(), defineField({name: 'guidesHeading', title: 'Overskrift over guidekarusell', type: 'string'}), defineField({name: 'careersHeading', title: 'Overskrift om rekruttering', type: 'string'}), defineField({name: 'careersText', title: 'Tekst om rekruttering', type: 'text', rows: 2})]}),
  defineType({name: 'employee', title: 'Ansatt', type: 'document', fields: [
    defineField({name: 'name', title: 'Navn', type: 'string', validation: Rule => Rule.required()}),
    defineField({name: 'slug', title: 'Profiladresse', type: 'slug', options: {source: 'name', isUnique: isUniqueContentSlug}, validation: Rule => Rule.required()}),
    defineField({name: 'role', title: 'Stilling', type: 'string', validation: Rule => Rule.required()}),
    defineField({name: 'phone', title: 'Telefonnummer', type: 'string'}),
    defineField({name: 'email', title: 'E-post', type: 'string', validation: Rule => Rule.custom(value => !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? true : 'Skriv en gyldig e-postadresse')}),
    image(), richText('bio', 'Om den ansatte'), order(),
  ], orderings: [{title: 'Rekkefølge', name: 'orderAsc', by: [{field: 'order', direction: 'asc'}]}], preview: {select: {title: 'name', subtitle: 'role', media: 'image'}}}),
  ...[
    ['guide', 'Guide'], ['service', 'Tjeneste'], ['job', 'Stillingsannonse'], ['page', 'Side'],
  ].map(([name, label]) => defineType({name, title: label, type: 'document', fields: [title(), slug(), intro(), image(), richText(), order(), ...(name === 'guide' ? [defineField({name: 'comparisonCaption', title: 'Overskrift over eventuell tabell', type: 'string'}), defineField({name: 'comparisonRows', title: 'Tabellrader (valgfritt)', description: 'I Watt, lumen og lux beholdes den opprinnelige tabellen hvis dette feltet ikke er satt.', type: 'array', of: [{type: 'object', name: 'comparisonRow', fields: [{name: 'unit', title: 'Enhet', type: 'string'}, {name: 'meaning', title: 'Betydning', type: 'text', rows: 2}], preview: {select: {title: 'unit'}}}]}), defineField({name: 'hideComparisonTable', title: 'Skjul tabell', type: 'boolean'})] : []), ...(name === 'job' ? [defineField({name: 'contact', title: 'Kontaktperson', type: 'reference', to: [{type: 'employee'}], options: {filter: '!defined(cmsMigrationTarget)'}}), defineField({name: 'applicationEmail', title: 'E-post for søknader', type: 'string', initialValue: 'oystein@tysverelektro.no'})] : [])], preview: {select: {title: 'title', subtitle: 'slug.current', media: 'image'}}})),
  defineType({name: 'siteSettings', title: 'Felles kontaktinformasjon', type: 'document', fields: [
    defineField({name: 'companyName', title: 'Firmanavn', type: 'string'}), defineField({name: 'email', title: 'Felles e-post', type: 'string'}), defineField({name: 'phone', title: 'Telefonnummer', type: 'string'}), defineField({name: 'address', title: 'Besøksadresse', type: 'text', rows: 3}), defineField({name: 'aboutIntro', title: 'Innledning på Om oss', type: 'text', rows: 4}), defineField({name: 'serviceArea', title: 'Hvor vi jobber', type: 'text', rows: 4}),

    defineField({name: 'orgNumber', title: 'Organisasjonsnummer', type: 'string'}),
    defineField({name: 'navigation', title: 'Hovedmeny (valgfritt)', description: 'La feltet være tomt for å bruke dagens meny. Nye andre sider vises da automatisk under Mer.', type: 'array', of: [{type: 'object', name: 'menuItem', title: 'Menypunkt', fields: [{name: 'title', title: 'Navn', type: 'string'}, {name: 'url', title: 'Lenke', type: 'string'}, {name: 'children', title: 'Undermeny', type: 'array', of: [{type: 'object', name: 'menuLink', fields: [{name: 'title', title: 'Navn', type: 'string'}, {name: 'url', title: 'Lenke', type: 'string'}]}]}], preview: {select: {title: 'title'}}}]}),
    defineField({name: 'facebook', title: 'Facebook-lenke', type: 'url'}), defineField({name: 'instagram', title: 'Instagram-lenke', type: 'url'}),
  ]}),
]
