#!/usr/bin/env node

import { createHash } from 'node:crypto'
import {
  mkdir,
  lstat,
  mkdtemp,
  readFile,
  readdir,
  rename,
  rm,
  writeFile
} from 'node:fs/promises'
import { basename, dirname, join, parse, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

const API_REPOSITORY = 'iptv-org/api'
const API_FILES = [
  'blocklist',
  'categories',
  'channels',
  'cities',
  'countries',
  'feeds',
  'guides',
  'languages',
  'logos',
  'regions',
  'streams',
  'subdivisions',
  'timezones'
]
const COMMIT_PATTERN = /^[0-9a-f]{40}$/
const DIGEST_PATTERN = /^[0-9a-f]{64}$/
const REQUEST_ATTEMPTS = 4
const REQUEST_TIMEOUT_MS = 180000
const COMMAND_OPTIONS = {
  create: new Set(['output', 'ref']),
  verify: new Set(['directory', 'expected-digest', 'expected-revision'])
}

function sha256(content) {
  return createHash('sha256').update(content).digest('hex')
}

function wait(milliseconds) {
  return new Promise(resolvePromise => setTimeout(resolvePromise, milliseconds))
}

function assertCommit(revision, label = 'revision') {
  const normalized = revision.trim().toLowerCase()
  if (!COMMIT_PATTERN.test(normalized)) {
    throw new Error(`Invalid API ${label}: ${revision}`)
  }

  return normalized
}

function normalizeDigest(digest) {
  const normalized = digest.trim().toLowerCase().replace(/^sha256:/, '')
  if (!DIGEST_PATTERN.test(normalized)) {
    throw new Error(`Invalid API snapshot digest: ${digest}`)
  }

  return normalized
}

function assertJsonArray(filename, content) {
  const value = JSON.parse(content.toString('utf8'))
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error(`${filename} does not contain a non-empty array`)
  }
}

async function pathExists(filename) {
  try {
    await lstat(filename)
    return true
  } catch (error) {
    if (error?.code === 'ENOENT') return false
    throw error
  }
}

async function request(url, headers = {}) {
  let lastError

  for (let attempt = 1; attempt <= REQUEST_ATTEMPTS; attempt++) {
    let response
    try {
      response = await fetch(url, {
        headers,
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)
      })
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))
    }

    if (response?.ok) return response
    if (response) {
      const retryable = response.status === 408 || response.status === 429 || response.status >= 500
      const detail = (await response.text()).trim().slice(0, 200)
      lastError = new Error(
        `Request failed with HTTP ${response.status}${detail ? `: ${detail}` : ''}`
      )
      if (!retryable) break
    }

    if (attempt < REQUEST_ATTEMPTS) await wait(500 * 2 ** (attempt - 1))
  }

  throw new Error(`Failed to download ${url}: ${lastError?.message ?? 'unknown error'}`)
}

async function resolveRevision(ref, token = process.env.GH_TOKEN || process.env.GITHUB_TOKEN) {
  const requestedRef = ref.trim()
  if (!requestedRef) throw new Error('API ref must not be empty')
  if (COMMIT_PATTERN.test(requestedRef.toLowerCase())) return assertCommit(requestedRef)

  const headers = {
    accept: 'application/vnd.github+json',
    'user-agent': 'iptv-org-epg-api-snapshot',
    'x-github-api-version': '2022-11-28'
  }
  if (token) headers.authorization = `Bearer ${token}`

  const response = await request(
    `https://api.github.com/repos/${API_REPOSITORY}/commits/${encodeURIComponent(requestedRef)}`,
    headers
  )
  const data = await response.json()

  return assertCommit(String(data.sha ?? ''), 'revision returned by GitHub')
}

async function verifySnapshot({ directory, expectedRevision, expectedDigest }) {
  const snapshotDirectory = resolve(directory)
  const expectedFiles = [
    ...API_FILES.map(filename => `${filename}.json`),
    'REVISION',
    'SHA256SUMS'
  ].sort()
  const actualFiles = (await readdir(snapshotDirectory)).sort()

  if (actualFiles.join('\n') !== expectedFiles.join('\n')) {
    throw new Error(
      `Unexpected API snapshot contents: expected ${expectedFiles.join(', ')}, got ${actualFiles.join(', ')}`
    )
  }

  const revision = assertCommit(await readFile(join(snapshotDirectory, 'REVISION'), 'utf8'))
  if (expectedRevision && revision !== assertCommit(expectedRevision, 'expected revision')) {
    throw new Error(`Unexpected API revision: ${revision}`)
  }

  const checksumContent = await readFile(join(snapshotDirectory, 'SHA256SUMS'))
  const checksumLines = checksumContent.toString('utf8').trimEnd().split('\n')
  const expectedChecksumFiles = API_FILES.map(filename => `${filename}.json`)

  if (checksumLines.length !== expectedChecksumFiles.length) {
    throw new Error(`Expected ${expectedChecksumFiles.length} checksums, got ${checksumLines.length}`)
  }

  for (const [index, line] of checksumLines.entries()) {
    const match = /^([0-9a-f]{64}) {2}([a-z]+\.json)$/.exec(line)
    const expectedFilename = expectedChecksumFiles[index]
    if (!match || match[2] !== expectedFilename) {
      throw new Error(`Invalid checksum entry: ${line}`)
    }

    const content = await readFile(join(snapshotDirectory, expectedFilename))
    assertJsonArray(expectedFilename, content)
    if (sha256(content) !== match[1]) {
      throw new Error(`Checksum mismatch for ${expectedFilename}`)
    }
  }

  const snapshotDigest = sha256(checksumContent)
  if (expectedDigest && snapshotDigest !== normalizeDigest(expectedDigest)) {
    throw new Error(`Unexpected API snapshot digest: ${snapshotDigest}`)
  }

  return { revision, snapshotDigest }
}

async function createSnapshot({ ref, output }) {
  const revision = await resolveRevision(ref)
  const outputDirectory = resolve(output)
  if (outputDirectory === parse(outputDirectory).root) {
    throw new Error('The API snapshot output must not be a filesystem root')
  }
  if (await pathExists(outputDirectory)) {
    throw new Error(`The API snapshot output already exists: ${outputDirectory}`)
  }

  const parentDirectory = dirname(outputDirectory)
  await mkdir(parentDirectory, { recursive: true })
  const temporaryDirectory = await mkdtemp(join(parentDirectory, `.${basename(outputDirectory)}-`))
  let completed = false

  try {
    const checksums = []
    for (const filename of API_FILES) {
      const response = await request(
        `https://raw.githubusercontent.com/${API_REPOSITORY}/${revision}/${filename}.json`
      )
      const content = Buffer.from(await response.arrayBuffer())
      const outputFilename = `${filename}.json`

      assertJsonArray(outputFilename, content)
      await writeFile(join(temporaryDirectory, outputFilename), content)
      checksums.push(`${sha256(content)}  ${outputFilename}`)
    }

    await writeFile(join(temporaryDirectory, 'REVISION'), `${revision}\n`)
    await writeFile(join(temporaryDirectory, 'SHA256SUMS'), `${checksums.join('\n')}\n`)

    const result = await verifySnapshot({
      directory: temporaryDirectory,
      expectedRevision: revision
    })

    await rename(temporaryDirectory, outputDirectory)
    completed = true

    return result
  } finally {
    if (!completed) await rm(temporaryDirectory, { recursive: true, force: true })
  }
}

function parseOptions(args) {
  const options = {}

  for (let index = 0; index < args.length; index++) {
    const argument = args[index]
    if (!argument.startsWith('--')) throw new Error(`Unexpected argument: ${argument}`)

    const name = argument.slice(2)
    const value = args[index + 1]
    if (value === undefined || value.startsWith('--')) {
      throw new Error(`Missing value for --${name}`)
    }
    if (name in options) throw new Error(`Duplicate option: --${name}`)

    options[name] = value
    index++
  }

  return options
}

function requireOption(options, name) {
  const value = options[name]
  if (!value) throw new Error(`Missing required option: --${name}`)

  return value
}

function assertKnownOptions(command, options) {
  const allowedOptions = COMMAND_OPTIONS[command]
  if (!allowedOptions) return

  for (const name of Object.keys(options)) {
    if (!allowedOptions.has(name)) throw new Error(`Unknown option for ${command}: --${name}`)
  }
}

async function main(args = process.argv.slice(2)) {
  const [command, ...optionArgs] = args
  const options = parseOptions(optionArgs)
  assertKnownOptions(command, options)
  let result

  switch (command) {
    case 'create':
      result = await createSnapshot({
        ref: requireOption(options, 'ref'),
        output: requireOption(options, 'output')
      })
      break
    case 'verify':
      result = await verifySnapshot({
        directory: requireOption(options, 'directory'),
        expectedRevision: options['expected-revision'],
        expectedDigest: options['expected-digest']
      })
      break
    default:
      throw new Error(`Unknown command: ${command || '(missing)'}`)
  }

  process.stdout.write(`${JSON.stringify(result)}\n`)
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href
if (isMain) {
  main().catch(error => {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`)
    process.exitCode = 1
  })
}

export { API_FILES, createSnapshot, resolveRevision, verifySnapshot }
