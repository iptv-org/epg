import { ReactNode } from 'react'
import { requireSession } from '@/lib/session'

export default async function AdminAppLayout({ children }: { children: ReactNode }) {
  await requireSession()
  return <>{children}</>
}
