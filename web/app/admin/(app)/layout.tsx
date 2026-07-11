import { ReactNode } from 'react'
import { requireSession } from '@/lib/session'
import NavBar from './NavBar'

export default async function AdminAppLayout({ children }: { children: ReactNode }) {
  await requireSession()
  return (
    <>
      <NavBar />
      {children}
    </>
  )
}
