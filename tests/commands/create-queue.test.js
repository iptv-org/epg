const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

beforeEach(() => {
  fs.rmdirSync('tests/__data__/output', { recursive: true })
  fs.mkdirSync('tests/__data__/output')

  const stdout = execSync(
    'DB_DIR=tests/__data__/output/database CHANNELS_PATH=tests/__data__/input/sites/*.channels.xml node scripts/commands/create-queue.js --max-clusters=1 --days=2',
    { encoding: 'utf8' }
  )
})

it('can create queue', () => {
  let output = content('tests/__data__/output/database/queue.db')
  let expected = content('tests/__data__/expected/database/queue.db')

  output = output.map(i => {
    i._id = null
    i.date = null
    return i
  })
  expected = expected.map(i => {
    i._id = null
    i.date = null
    return i
  })

  expect(output).toEqual(
    expect.arrayContaining([
      expect.objectContaining(expected[0]),
      expect.objectContaining(expected[1]),
      expect.objectContaining(expected[2]),
      expect.objectContaining(expected[3])
    ])
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
