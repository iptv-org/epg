import fs from 'fs-extra'
import { execSync } from 'child_process'
import os from 'os'
import { pathToFileURL } from 'node:url'

type ExecError = {
  status: number
  stdout: string
}

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
    try {
      const stdout = execSync(cmd, { encoding: 'utf8' })
      if (process.env.DEBUG === 'true') console.log(cmd, stdout)
      checkStdout(stdout)
      expect(content('tests/__data__/output/channels.xml')).toEqual(
        content('tests/__data__/expected/sites/channels-edit/example.com.channels.xml')
      )
    } catch (error) {
      // NOTE: for Windows only
      if (process.env.DEBUG === 'true') console.log(cmd, error)
      checkStdout((error as ExecError).stdout)
      expect(content('tests/__data__/output/channels.xml')).toEqual(
        content('tests/__data__/expected/sites/channels-edit/example.com.channels.xml')
      )
    }
  })
})

function checkStdout(stdout: string) {
  expect(stdout).toContain('CNN International Europe | CNNInternationalEurope.us')
  expect(stdout).toContain('Type...')
  expect(stdout).toContain('Skip')
  expect(stdout).toContain("File 'tests/__data__/output/channels.xml' successfully saved")
}

function content(filepath: string) {
  return fs.readFileSync(pathToFileURL(filepath), {
    encoding: 'utf8'
  })
}
