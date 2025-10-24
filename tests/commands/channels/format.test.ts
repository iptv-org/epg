import { execSync } from 'child_process'
import { pathToFileURL } from 'node:url'
import fs from 'fs-extra'

beforeEach(() => {
  fs.emptyDirSync('tests/__data__/output')
  fs.copySync(
    'tests/__data__/input/channels_format/example.com.channels.xml',
    'tests/__data__/output/example.com.channels.xml'
  )
})

describe('channels:format', () => {
  it('can format *.channels.xml files', () => {
    const cmd = 'npm run channels:format --- tests/__data__/output/example.com.channels.xml'
    const stdout = execSync(cmd, { encoding: 'utf8' })
    if (process.env.DEBUG === 'true') console.log(cmd, stdout)

    expect(content('tests/__data__/output/example.com.channels.xml')).toEqual(
      content('tests/__data__/expected/channels_format/example.com.channels.xml')
    )
  })
})

function content(filepath: string) {
  return fs.readFileSync(pathToFileURL(filepath), {
    encoding: 'utf8'
  })
}
