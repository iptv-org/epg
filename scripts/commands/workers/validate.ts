import { Storage } from '@freearhey/storage-js'
import { ROOT_DIR } from '../../constants'
import { program } from 'commander'
import chalk from 'chalk'

program.parse(process.argv)

interface ValidationError {
  line: number
  type: 'missing_crlf' | 'contains_spaces'
  content: string
}

async function main() {
  const rootStorage = new Storage(ROOT_DIR)
  
  if (!await rootStorage.exists('workers.txt')) {
    console.log(chalk.red('workers.txt file not found!'))
    process.exit(1)
  }

  const workersTxt = await rootStorage.load('workers.txt')
  const lines = workersTxt.split('\n')
  
  let totalFiles = 0
  let totalErrors = 0
  let totalWarnings = 0

  const errors: ValidationError[] = []
  
  lines.forEach((line, index) => {
    const lineNum = index + 1

    if (lineNum === lines.length && line.trim() === '') return

    if (!line.endsWith('\r')) {
      errors.push({ line: lineNum, type: 'missing_crlf', content: line.replace(/\r/g, '') })
      totalErrors++
    }

    if (line.includes(' ')) {
      errors.push({ line: lineNum, type: 'contains_spaces', content: line.replace(/\r/g, '') })
      totalErrors++
    }
  })

  if (errors.length) {
    console.log(chalk.underline('workers.txt'))
    console.table(errors, ['line', 'type', 'content'])
    console.log()
    totalFiles++
  }

  const totalProblems = totalWarnings + totalErrors
  if (totalProblems > 0) {
    console.log(
      chalk.red(
        `${totalProblems} problems (${totalErrors} errors, ${totalWarnings} warnings) in ${totalFiles} file(s)`
      )
    )
    if (totalErrors > 0) {
      process.exit(1)
    }
  }
}

main()
