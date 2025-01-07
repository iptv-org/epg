import { execSync } from 'child_process'

type ExecError = {
  status: number
  stdout: string
}

describe('channels:lint', () => {
  it('will show a message if the file contains a syntax error', () => {
    try {
      const cmd = 'npm run channels:lint --- tests/__data__/input/channels-lint/error.channels.xml'
      const stdout = execSync(cmd, { encoding: 'utf8' })
      if (process.env.DEBUG === 'true') console.log(cmd, stdout)
      process.exit(1)
    } catch (error) {
      expect((error as ExecError).status).toBe(1)
      expect((error as ExecError).stdout).toContain(
        "error.channels.xml\n 3:0  Element 'channel': The attribute 'lang' is required but missing.\n\n1 error(s)\n"
      )
    }
  })

  it('will show a message if an error occurred while parsing an xml file', () => {
    try {
      const cmd =
        'npm run channels:lint --- tests/__data__/input/channels-lint/invalid.channels.xml'
      const stdout = execSync(cmd, { encoding: 'utf8' })
      if (process.env.DEBUG === 'true') console.log(cmd, stdout)
      process.exit(1)
    } catch (error) {
      expect((error as ExecError).status).toBe(1)
      expect((error as ExecError).stdout).toContain(
        'invalid.channels.xml\n 2:6  XML declaration allowed only at the start of the document\n'
      )
    }
  })

  it('can test multiple files at ones', () => {
    try {
      const cmd =
        'npm run channels:lint --- tests/__data__/input/channels-lint/error.channels.xml tests/__data__/input/channels-lint/invalid.channels.xml'
      const stdout = execSync(cmd, { encoding: 'utf8' })
      if (process.env.DEBUG === 'true') console.log(cmd, stdout)
      process.exit(1)
    } catch (error) {
      expect((error as ExecError).status).toBe(1)
      expect((error as ExecError).stdout).toContain(
        "error.channels.xml\n 3:0  Element 'channel': The attribute 'lang' is required but missing.\n"
      )
      expect((error as ExecError).stdout).toContain(
        'invalid.channels.xml\n 2:6  XML declaration allowed only at the start of the document\n'
      )
      expect((error as ExecError).stdout).toContain('2 error(s)')
    }
  })
})
