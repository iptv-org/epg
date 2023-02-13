const { Octokit } = require('@octokit/core')
const dayjs = require('dayjs')
const isToday = require('dayjs/plugin/isToday')
const utc = require('dayjs/plugin/utc')
const unzipit = require('unzipit')
const { file, logger } = require('../../core')

dayjs.extend(isToday)
dayjs.extend(utc)

const DB_DIR = process.env.DB_DIR || './scripts/database'
const programsPath = `${DB_DIR}/programs.db`
const queuePath = `${DB_DIR}/queue.db`

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN
})

async function main() {
  try {
    let workflows = await getWorkflows()
    logger.info(`found ${workflows.length} workflows\r\n`)

    await file.create(programsPath)
    await file.create(queuePath)
    const total = workflows.length
    for (let [i, workflow] of workflows.entries()) {
      logger.info(`[${i + 1}/${total}] ${workflow.name}`)
      const run = await getWorkflowRun(workflow)
      if (!run) continue

      let artifact = await getRunArtifacts(run)

      const programsBuffer = await downloadArtifact(artifact, 'programs.db')
      await file.append(programsPath, programsBuffer)

      const queueBuffer = await downloadArtifact(artifact, 'queue.db')
      await file.append(queuePath, queueBuffer)
    }
  } catch (err) {
    console.log(err.message)
  }
}

main()

async function downloadArtifact(artifact, filename) {
  let results = await octokit.request(
    'GET /repos/{owner}/{repo}/actions/artifacts/{artifact_id}/{archive_format}',
    {
      owner: 'iptv-org',
      repo: 'epg',
      artifact_id: artifact.id,
      archive_format: 'zip'
    }
  )

  const { entries } = await unzipit.unzip(results.data)

  const arrayBuffer = await entries[filename].arrayBuffer()

  return toString(arrayBuffer)
}

async function getRunArtifacts(run) {
  let results = await octokit.request('GET /repos/{owner}/{repo}/actions/runs/{run_id}/artifacts', {
    owner: 'iptv-org',
    repo: 'epg',
    run_id: run.id
  })

  return results.data.artifacts.find(a => a.name === 'database')
}

async function getWorkflowRun(workflow) {
  let today = dayjs.utc().subtract(1, 'd').format('YYYY-MM-DD')
  let results = await octokit.request(
    'GET /repos/{owner}/{repo}/actions/workflows/{workflow_id}/runs',
    {
      owner: 'iptv-org',
      repo: 'epg',
      workflow_id: workflow.id,
      status: 'success',
      created: `>=${today}`
    }
  )

  return results.data.workflow_runs.find(
    r => r.event === 'schedule' || r.event === 'workflow_dispatch'
  )
}

async function getWorkflows() {
  let workflows = []
  for (let page of [1, 2, 3]) {
    try {
      let results = await octokit.request('GET /repos/{owner}/{repo}/actions/workflows', {
        owner: 'iptv-org',
        repo: 'epg',
        per_page: 100,
        page
      })

      workflows = workflows.concat(results.data.workflows)
    } catch (err) {
      console.log(err.message)
    }
  }

  return workflows.filter(w => !/^_/.test(w.name) && w.name !== 'pages-build-deployment')
}

function toString(arrayBuffer) {
  return new TextDecoder().decode(arrayBuffer)
}
