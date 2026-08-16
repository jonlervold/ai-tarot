import type { ReactNode } from 'react'

type Props = {
  children: ReactNode
}

export function CardGrid({ children }: Props) {
  return <div className="card-list">{children}</div>
}
