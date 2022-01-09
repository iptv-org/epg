const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

beforeEach(() => {
  fs.rmdirSync('tests/__data__/output', { recursive: true })
  fs.mkdirSync('tests/__data__/output')
})

it('can create channels database', () => {
  const results = execSync(
    'DB_DIR=tests/__data__/output/database node scripts/commands/create-database.js --channels=tests/__data__/input/site.channels.xml --max-clusters=1',
    { encoding: 'utf8' }
  )

  const database = fs.readFileSync(path.resolve('tests/__data__/output/database/channels.db'), {
    encoding: 'utf8'
  })
  const item = database.split('\n').find(i => i.includes('AndorraTV.ad'))
  expect(JSON.parse(item)).toMatchObject({
    name: 'Andorra TV',
    lang: 'ca',
    xmltv_id: 'AndorraTV.ad',
    site_id: 'atv',
    site: 'andorradifusio.ad',
    channelsPath: 'tests/__data__/input/site.channels.xml',
    configPath: 'tests/__data__/input/andorradifusio.ad.config.js',
    cluster_id: 1
  })
})
