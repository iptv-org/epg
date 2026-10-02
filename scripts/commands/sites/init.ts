import { SITES_DIR, EOL } from '../../constants'
import { Storage } from '@freearhey/storage-js'
import { Logger } from '@freearhey/core'
import { pathToFileURL } from 'node:url'
import { program } from 'commander'
import fs from 'fs-extra'

program.argument('<site>', 'Domain name of the site').parse(process.argv)

const domain = program.args[0]

async function main() {
  const storage = new Storage(SITES_DIR)
  const logger = new Logger()

  logger.info(`Initializing "${domain}"...${EOL}`)

  const dir = domain
  if (await storage.exists(dir)) {
    throw new Error(`Folder "${dir}" already exists`)
  }

  await storage.createDir(dir)

  logger.info(`Creating "${dir}/${domain}.test.js"...`)
  const testTemplate = fs.readFileSync(pathToFileURL('scripts/templates/_test.js'), {
    encoding: 'utf8'
  })
  await storage.save(`${dir}/${domain}.test.js`, testTemplate.replace(/<DOMAIN>/g, domain))

  logger.info(`Creating "${dir}/${domain}.config.js"...`)
  const configTemplate = fs.readFileSync(pathToFileURL('scripts/templates/_config.js'), {
    encoding: 'utf8'
  })
  await storage.save(`${dir}/${domain}.config.js`, configTemplate.replace(/<DOMAIN>/g, domain))

  logger.info(`Creating "${dir}/readme.md"...`)
  const readmeTemplate = fs.readFileSync(pathToFileURL('scripts/templates/_readme.md'), {
    encoding: 'utf8'
  })
  await storage.save(`${dir}/readme.md`, readmeTemplate.replace(/<DOMAIN>/g, domain))

  logger.info(`${EOL}Done`)
}

main()
