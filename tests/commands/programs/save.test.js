const { execSync } = require('child_process')
const fs = require('fs-extra')
const path = require('path')

beforeEach(() => {
  fs.emptyDirSync('tests/__data__/output')
  fs.copyFileSync('tests/__data__/input/database/queue.db', 'tests/__data__/output/queue.db')

  const stdout = execSync(
    'DB_DIR=tests/__data__/output LOGS_DIR=tests/__data__/input/logs npm run programs:save',
    { encoding: 'utf8' }
  )
})

it('can save programs to database', () => {
  let output = content('tests/__data__/output/programs.db')
  let expected = content('tests/__data__/expected/database/programs.db')

  output = output.map(i => {
    i._id = null
    return i
  })
  expected = expected.map(i => {
    i._id = null
    return i
  })

  expect(output).toEqual(expected)
})

it('can update queue', () => {
  expect(content('tests/__data__/output/queue.db')).toEqual(
    content('tests/__data__/expected/database/queue-with-errors.db')
  )
})

function content(filepath) {
  const data = fs.readFileSync(path.resolve(filepath), {
    encoding: 'utf8'
  })

  return data
    .split('\n')
    .filter(l => l)
    .map(l => {
      return JSON.parse(l)
    })
}
