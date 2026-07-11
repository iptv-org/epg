import { NextRequest } from 'next/server'
import { getJobMeta, getJobLog } from '@/lib/jobStorage'
import { subscribeToJob, reconcileJobMeta } from '@/lib/jobRunner'
import { isAuthorized } from '@/lib/session'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isAuthorized(request)) {
    return new Response('unauthorized', { status: 401 })
  }

  const { id } = await params
  const rawJob = getJobMeta(id)
  if (!rawJob) {
    return new Response('not found', { status: 404 })
  }
  // If this job was left `running` by a previous process instance, this
  // process has no live emitter for it and will never see a 'done' event —
  // reconcile it to `interrupted` first so the branch below sends a
  // snapshot + done and closes, instead of opening an indefinite
  // subscription that can never resolve.
  const job = reconcileJobMeta(rawJob)

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ log: getJobLog(id) })}\n\n`))

      if (job.status !== 'running') {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true, status: job.status })}\n\n`))
        controller.close()
        return
      }

      const unsubscribe = subscribeToJob(
        id,
        line => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ line })}\n\n`))
        },
        meta => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true, status: meta.status })}\n\n`))
          controller.close()
          unsubscribe()
        }
      )

      request.signal.addEventListener('abort', () => {
        unsubscribe()
      })
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive'
    }
  })
}
