// web/app/admin/channels/page.tsx
import { requireSession } from '@/lib/session'
import ChannelsClient from './ChannelsClient'

export default async function ChannelsPage() {
  await requireSession()
  return <ChannelsClient />
}
