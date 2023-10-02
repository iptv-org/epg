import { execSync } from 'child_process'
import fs from 'fs-extra'
import path from 'path'

beforeEach(() => {
  fs.emptyDirSync('tests/__data__/output')
  fs.copySync(
    'tests/__data__/input/channels-parse/channels-parse.channels.xml',
    'tests/__data__/output/channels.xml'
  )
})

describe('channels:parse', () => {
  it('can parse channels', () => {
    execSync(
      'npm run channels:parse -- --config=tests/__data__/input/channels-parse/channels-parse.config.js --output=tests/__data__/output/channels.xml',
      { encoding: 'utf8' }
    )

    expect(content('tests/__data__/output/channels.xml')).toEqual(
      content('tests/__data__/expected/sites/channels-parse/channels-parse.channels.xml')
    )
  })

  it('can parse channels with clean flag', () => {
    execSync(
      'npm run channels:parse -- --config=tests/__data__/input/channels-parse/channels-parse.config.js --output=tests/__data__/output/channels.xml --clean',
      { encoding: 'utf8' }
    )

    expect(content('tests/__data__/output/channels.xml')).toEqual(
      content('tests/__data__/expected/sites/channels-parse/channels-parse-clean.channels.xml')
    )
  })
})

function content(filepath: string) {
  return fs.readFileSync(path.resolve(filepath), {
    encoding: 'utf8'
  })
}
