// web/app/api/admin/channels/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { execFileSync } from 'child_process'
import path from 'path'
import { readChannels, addChannel, removeChannel, Channel } from '@/lib/channels'
import { isAuthorized } from '@/lib/session'

function rebuildChannelFiles() {
  execFileSync('node', ['scripts/build-channels.js'], {
    cwd: path.resolve(process.cwd(), '..')
  })
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  return NextResponse.json({ channels: readChannels() })
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  const site = typeof body?.site === 'string' ? body.site.trim() : ''
  const siteId = typeof body?.siteId === 'string' ? body.siteId.trim() : ''
  const name = typeof body?.name === 'string' ? body.name.trim() : ''
  const lang = typeof body?.lang === 'string' && body.lang.trim() ? body.lang.trim() : 'en'
  const xmltvId = typeof body?.xmltvId === 'string' ? body.xmltvId.trim() : ''

  if (!site || !siteId || !name) {
    return NextResponse.json({ error: 'site, siteId and name are required' }, { status: 400 })
  }

  const channel: Channel = { site, siteId, lang, xmltvId, name }
  const result = addChannel(channel)
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 409 })
  }

  rebuildChannelFiles()
  return NextResponse.json({ ok: true }, { status: 201 })
}

export async function DELETE(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const site = searchParams.get('site')
  const siteId = searchParams.get('siteId')

  if (!site || !siteId) {
    return NextResponse.json({ error: 'site and siteId query params are required' }, { status: 400 })
  }

  const result = removeChannel(site, siteId)
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 404 })
  }

  rebuildChannelFiles()
  return NextResponse.json({ ok: true })
}
