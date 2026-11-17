import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {schemaTypes} from './schemaTypes'
import {ImportContent} from './ImportContent'
import {SearchStatistics} from './SearchStatistics'

export default defineConfig({
  name: 'tysver-elektro',
  title: 'Tysvær Elektro – administrasjon',
  projectId: '89cnbpsm',
  dataset: 'production',
  plugins: [structureTool({structure: S => S.list().title('Nettsiden').items([
    S.listItem().title('Forsiden').child(S.document().schemaType('home').documentId('home')),
    S.listItem().title('Om oss og kontaktinformasjon').child(S.document().schemaType('siteSettings').documentId('siteSettings')),
    ...[
      ['employee', 'Ansatte'], ['guide', 'Guider'], ['service', 'Tjenester'], ['job', 'Ledige stillinger'], ['page', 'Andre sider'],
    ].map(([type, title]) => S.listItem().title(title).child(S.documentTypeList(type).title(title).filter('_type == $type && !defined(cmsMigrationTarget)').params({type}).apiVersion('2026-11-03'))),
  ])})],
  tools: [{name:'search-statistics',title:'Søkestatistikk',component:SearchStatistics}, ...((import.meta as ImportMeta & {env?: {DEV?: boolean}}).env?.DEV ? [{name: 'import-content', title: 'Første import', component: ImportContent}] : [])],
  schema: {types: schemaTypes},
})
