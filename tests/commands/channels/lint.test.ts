import { execSync } from 'child_process'

type ExecError = {
  status: number
  stdout: string
}

describe('channels:lint', () => {
  it('will show a message if the file contains a syntax error', () => {
    try {
      const stdout = execSync(
        'npm run channels:lint -- --channels=tests/__data__/input/channels-lint/channels-lint.channels.xml',
        {
          encoding: 'utf8'
        }
      )
      console.log(stdout)
      process.exit(1)
    } catch (error) {
      expect((error as ExecError).status).toBe(1)
      expect((error as ExecError).stdout).toContain(
        "tests/__data__/input/channels-lint/channels-lint.channels.xml\n 3:0  Element 'channel': The attribute 'lang' is required but missing.\n\n1 error(s)\n"
      )
    }
  })
})
