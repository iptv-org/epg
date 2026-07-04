import { NextRequest, NextResponse } from 'next/server'
import { buildCatalogIndex, searchCatalog, CatalogEntry } from '@/lib/catalog'
import { isAuthorized } from '@/lib/session'

let cachedIndex: CatalogEntry[] | null = null

function getIndex(): CatalogEntry[] {
  if (!cachedIndex) cachedIndex = buildCatalogIndex()
  return cachedIndex
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q') || ''
  const results = searchCatalog(getIndex(), query).slice(0, 50)
  return NextResponse.json({ results })
}
