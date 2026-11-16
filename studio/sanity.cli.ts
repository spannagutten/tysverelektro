import {defineCliConfig} from 'sanity/cli'
declare const process: {env: Record<string,string|undefined>}
export default defineCliConfig({
  api: {projectId: '89cnbpsm', dataset: 'production'},
  project: {basePath: process.env.SANITY_STUDIO_BASEPATH || '/'},
})
