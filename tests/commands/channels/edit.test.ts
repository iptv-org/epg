import fs from 'fs-extra'
import { execSync } from 'child_process'
import os from 'os'
import { pathToFileURL } from 'node:url'

let ENV_VAR = 'DATA_DIR=tests/__data__/input/temp/data'
if (os.platform() === 'win32') {
  ENV_VAR = 'SET "DATA_DIR=tests/__data__/input/temp/data" &&'
}

beforeEach(() => {
  fs.emptyDirSync('tests/__data__/output')
  fs.copySync(
    'tests/__data__/input/channels-edit/example.com.channels.xml',
    'tests/__data__/output/channels.xml'
  )
})

describe('channels:edit', () => {
  it('shows list of options for a channel', () => {
    const cmd = `${ENV_VAR} npm run channels:edit --- tests/__data__/output/channels.xml`
    const stdout = execSync(cmd, { encoding: 'utf8' })
    if (process.env.DEBUG === 'true') console.log(cmd, stdout)
    expect(stdout).toContain('CNN International Europe | CNNInternationalEurope.us')
    expect(stdout).toContain('Type...')
    expect(stdout).toContain('Skip')
    expect(stdout).toContain("File 'tests/__data__/output/channels.xml' successfully saved")
    expect(content('tests/__data__/output/channels.xml')).toEqual(
      content('tests/__data__/expected/sites/channels-edit/example.com.channels.xml')
    )
  })
})

function content(filepath: string) {
  return fs.readFileSync(pathToFileURL(filepath), {
    encoding: 'utf8'
  })
}
