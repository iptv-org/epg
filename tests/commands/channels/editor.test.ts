import fs from 'fs-extra'
import { execSync } from 'child_process'
import os from 'os'
import path from 'path'

type ExecError = {
  status: number
  stdout: string
}

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

    try {
      const cmd = `${ENV_VAR} npm run channels:editor --- tests/__data__/output/channels.xml`
      execSync(cmd, { encoding: 'utf8' })
    } catch (error) {
      expect((error as ExecError).status).toBe(1)
      expect((error as ExecError).stdout).toContain('CNN International | CNNInternational.us [new]')
      expect((error as ExecError).stdout).toContain(
        'CNN International Europe | CNNInternationalEurope.us [api]'
      )
      expect((error as ExecError).stdout).toContain('Overwrite')
      expect((error as ExecError).stdout).toContain('Skip')
      expect((error as ExecError).stdout).toContain(
        "File 'tests/__data__/output/channels.xml' successfully saved"
      )
      expect(content('tests/__data__/output/channels.xml')).toEqual(
        content('tests/__data__/expected/sites/channels-editor/channels-editor.channels.xml')
      )
    }
  })
})

function content(filepath: string) {
  return fs.readFileSync(path.resolve(filepath), {
    encoding: 'utf8'
  })
}
