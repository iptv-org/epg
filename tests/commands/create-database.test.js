const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

beforeEach(() => {
  fs.rmdirSync('tests/__data__/output', { recursive: true })
  fs.mkdirSync('tests/__data__/output')

  execSync(
    'DB_DIR=tests/__data__/output/database node scripts/commands/create-database.js --channels=tests/__data__/input/*.channels.xml --max-clusters=1',
    { encoding: 'utf8' }
  )
})

it('can create channels database', () => {
  const output = content('tests/__data__/output/database/channels.db')

  expect(output).toMatchObject({
    lang: 'ru',
    xmltv_id: 'CNNInternationalEurope.us',
    site_id: '140',
    name: 'CNN International Europe',
    site: 'example.com',
    channelsPath: 'tests/__data__/input/example.com.channels.xml',
    configPath: 'tests/__data__/input/example.com.config.js',
    cluster_id: 1
  })
})

function content(filepath) {
  const data = fs.readFileSync(path.resolve(filepath), {
    encoding: 'utf8'
  })

  return JSON.parse(data)
}
