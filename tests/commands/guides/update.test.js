const { execSync } = require('child_process')
const fs = require('fs-extra')
const path = require('path')

beforeEach(() => {
  fs.emptyDirSync('tests/__data__/output')
  fs.copyFileSync('tests/__data__/input/database/queue.db', 'tests/__data__/output/queue.db')
  fs.copyFileSync('tests/__data__/input/database/programs.db', 'tests/__data__/output/programs.db')

  const stdout = execSync(
    'DB_DIR=tests/__data__/output DATA_DIR=tests/__data__/input/data PUBLIC_DIR=tests/__data__/output LOGS_DIR=tests/__data__/output/logs npm run guides:update',
    { encoding: 'utf8' }
  )
})

it('can generate /guides', () => {
  expect(content('tests/__data__/output/guides/fr/chaines-tv.orange.fr.epg.xml')).toBe(
    content('tests/__data__/expected/guides/fr/chaines-tv.orange.fr.epg.xml')
  )

  expect(content('tests/__data__/output/guides/zw/dstv.com.epg.xml')).toBe(
    content('tests/__data__/expected/guides/zw/dstv.com.epg.xml')
  )
})

it('can create guides.log', () => {
  expect(content('tests/__data__/output/logs/guides/update.log')).toBe(
    content('tests/__data__/expected/logs/guides/update.log')
  )
})

function content(filepath) {
  const data = fs.readFileSync(path.resolve(filepath), {
    encoding: 'utf8'
  })

  return JSON.stringify(data)
}
