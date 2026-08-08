import { execSync } from 'child_process'
import fs from 'fs-extra'

interface ExecError {
  status: number
  stdout: string
}

const ENV_VAR = 'cross-env ROOT_DIR=tests/__data__/output'

beforeEach(() => {
  fs.emptyDirSync('tests/__data__/output')
})

describe('workers:validate', () => {
  it('will show a message if workers.txt does not exist', () => {
    try {
      const cmd = `${ENV_VAR} npm run workers:validate`
      const stdout = execSync(cmd, { encoding: 'utf8' })
      if (process.env.DEBUG === 'true') console.log(cmd, stdout)
      process.exit(1)
    } catch (error) {
      expect((error as ExecError).status).toBe(1)
      expect((error as ExecError).stdout).toContain('workers.txt file not found!')
    }
  })

  it('will show a message if workers.txt contains validation error', () => {
    try {
      fs.writeFileSync('tests/__data__/output/workers.txt', 'worker1.example.com\nworker 2.example.com\r\nworker3.example.com')
      const cmd = `${ENV_VAR} npm run workers:validate`
      const stdout = execSync(cmd, { encoding: 'utf8' })
      if (process.env.DEBUG === 'true') console.log(cmd, stdout)
      process.exit(1)
    } catch (error) {
      expect((error as ExecError).status).toBe(1)
      expect((error as ExecError).stdout).toContain(`
┌─────────┬──────┬───────────────────┬────────────────────────┐
│ (index) │ line │ type              │ content                │
├─────────┼──────┼───────────────────┼────────────────────────┤
│ 0       │ 1    │ 'missing_crlf'    │ 'worker1.example.com'  │
│ 1       │ 2    │ 'contains_spaces' │ 'worker 2.example.com' │
│ 2       │ 3    │ 'missing_crlf'    │ 'worker3.example.com'  │
└─────────┴──────┴───────────────────┴────────────────────────┘

3 problems (3 errors, 0 warnings) in 1 file(s)
`)
    }
  })

  it('does not display errors if there are none', () => {
    try {
      fs.writeFileSync('tests/__data__/output/workers.txt', 'worker1.example.com\r\nworker2.example.com\r\nworker3.example.com\r\n')
      const cmd = `${ENV_VAR} npm run workers:validate`
      const stdout = execSync(cmd, { encoding: 'utf8' })
      if (process.env.DEBUG === 'true') console.log(cmd, stdout)
    } catch (error) {
      if (process.env.DEBUG === 'true') console.log((error as ExecError).stdout)
      process.exit(1)
    }
  })
})
