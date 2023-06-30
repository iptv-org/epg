const { execSync } = require('child_process')
const fs = require('fs-extra')
const path = require('path')

beforeEach(() => {
  fs.emptyDirSync('tests/__data__/output')
  fs.copySync(
    'tests/__data__/input/sites/parse-channels.channels.xml',
    'tests/__data__/output/channels.xml'
  )
})

it('can parse channels', () => {
  const stdout = execSync(
    'npm run channels:parse -- --config=tests/__data__/input/sites/parse-channels.config.js --output=tests/__data__/output/channels.xml',
    { encoding: 'utf8' }
  )

  expect(content('tests/__data__/output/channels.xml')).toEqual(
    content('tests/__data__/expected/sites/parse-channels.channels.xml')
  )
})

it('can parse channels with clean flag', () => {
  const stdout = execSync(
    'npm run channels:parse -- --config=tests/__data__/input/sites/parse-channels.config.js --output=tests/__data__/output/channels.xml --clean',
    { encoding: 'utf8' }
  )

  expect(content('tests/__data__/output/channels.xml')).toEqual(
    content('tests/__data__/expected/sites/parse-channels-clean.channels.xml')
  )
})

function content(filepath) {
  return fs.readFileSync(path.resolve(filepath), {
    encoding: 'utf8'
  })
}
