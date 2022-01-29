const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

beforeEach(() => {
  fs.rmdirSync('tests/__data__/output', { recursive: true })
  fs.mkdirSync('tests/__data__/output')

  const stdout = execSync(
    'DB_DIR=tests/__data__/output/database node scripts/commands/create-queue.js --channels=tests/__data__/input/sites/*.channels.xml --max-clusters=1',
    { encoding: 'utf8' }
  )
})

it('can create queue', () => {
  const output = content('tests/__data__/output/database/queue.db')

  expect(output).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        lang: 'ru',
        xmltv_id: 'CNNInternationalEurope.us',
        site_id: '140',
        site: 'example.com',
        configPath: 'tests/__data__/input/sites/example.com.config.js',
        groups: ['ca-nl/example.com'],
        cluster_id: 1
      }),
      expect.objectContaining({
        lang: 'en',
        xmltv_id: 'CNNInternationalEurope2.us',
        site_id: '141',
        site: 'example.com',
        configPath: 'tests/__data__/input/sites/example.com.config.js',
        groups: ['ca-nl/example.com'],
        cluster_id: 1
      })
    ])
  )
})

function content(filepath) {
  const data = fs.readFileSync(path.resolve(filepath), {
    encoding: 'utf8'
  })

  return data
    .split('\n')
    .filter(l => l)
    .map(l => {
      return JSON.parse(l)
    })
}
