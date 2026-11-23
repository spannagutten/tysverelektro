import {defineConfig} from 'sanity'
import {SearchStatistics} from './SearchStatistics'

// Sanity is retained only for authenticated access to search statistics.
// Public website content is served directly from the public HTML files.
export default defineConfig({
  name: 'tysver-elektro',
  title: 'Tysvær Elektro – søkestatistikk',
  projectId: '89cnbpsm',
  dataset: 'production',
  plugins: [],
  tools: [{name:'search-statistics',title:'Søkestatistikk',component:SearchStatistics}],
  schema: {types: []},
})
