import { execSync } from 'child_process'
import fs from 'fs-extra'
import { pathToFileURL } from 'node:url'

beforeEach(() => {
  fs.emptyDirSync('tests/__data__/output')
  fs.copySync(
    'tests/__data__/input/channels-parse/channels-parse.channels.xml',
    'tests/__data__/output/channels.xml'
  )
})

describe('channels:parse', () => {
  it('can parse channels', () => {
    const cmd =
      'npm run channels:parse --- --config=tests/__data__/input/channels-parse/channels-parse.config.js --output=tests/__data__/output/channels.xml'
    const stdout = execSync(cmd, { encoding: 'utf8' })
    if (process.env.DEBUG === 'true') console.log(cmd, stdout)

    expect(content('tests/__data__/output/channels.xml')).toEqual(
      content('tests/__data__/expected/sites/channels-parse/channels-parse.channels.xml')
    )
  })
})

function content(filepath: string) {
  return fs.readFileSync(pathToFileURL(filepath), {
    encoding: 'utf8'
  })
}
