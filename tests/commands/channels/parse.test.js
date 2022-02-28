const { execSync } = require('child_process')
const fs = require('fs-extra')
const path = require('path')

beforeEach(() => {
  fs.emptyDirSync('tests/__data__/output')

  const stdout = execSync(
    'npm run channels:parse -- --config=tests/__data__/input/sites/parse-channels.config.js --output=tests/__data__/output/channels.xml',
    { encoding: 'utf8' }
  )
})

it('can parse channels', () => {
  expect(content('tests/__data__/output/channels.xml')).toEqual(
    content('tests/__data__/expected/sites/parse-channels.channels.xml')
  )
})

function content(filepath) {
  return fs.readFileSync(path.resolve(filepath), {
    encoding: 'utf8'
  })
}
