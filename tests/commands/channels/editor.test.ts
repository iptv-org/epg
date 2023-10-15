import fs from 'fs-extra'
import { execSync } from 'child_process'
import os from 'os'

beforeEach(() => {
  fs.emptyDirSync('tests/__data__/output')
  fs.copySync(
    'tests/__data__/input/channels-editor/channels-editor.channels.xml',
    'tests/__data__/output/channels.xml'
  )
})

describe('channels:editor', () => {
  it('shows list of options for a channel', () => {
    let ENV_VAR = 'DATA_DIR=tests/__data__/input/temp/data'
    if (os.platform() === 'win32') {
      ENV_VAR = 'SET "DATA_DIR=tests/__data__/input/temp/data" &&'
    }

    const cmd = `${ENV_VAR} npm run channels:editor -- tests/__data__/output/channels.xml`
    const stdout = execSync(cmd, { encoding: 'utf8' })

    expect(stdout).toContain('CNN International | CNNInternational.us [new]')
    expect(stdout).toContain('CNN International Europe | CNNInternationalEurope.us [api]')
    expect(stdout).toContain('Overwrite')
    expect(stdout).toContain('Skip')
    expect(stdout).toContain("File 'tests/__data__/output/channels.xml' successfully saved")
  })
})
