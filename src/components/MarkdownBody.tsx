import type { ReactNode } from 'react'

type Props = {
  text: string
}

function inline(value: string): ReactNode[] {
  return value.split(/(\*\*[^*]+\*\*)/g).map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={index}>{part.slice(2, -2)}</strong>
    }
    return part
  })
}

export function MarkdownBody({ text }: Props) {
  const lines = text.split('\n')

  return (
    <>
      {lines.map((line, index) => {
        if (line.startsWith('### ')) {
          return <h4 key={index}>{inline(line.slice(4))}</h4>
        }
        if (line.startsWith('## ')) {
          return <h3 key={index}>{inline(line.slice(3))}</h3>
        }
        if (line.startsWith('# ')) {
          return <h3 key={index}>{inline(line.slice(2))}</h3>
        }
        if (line.trim() === '') {
          return <div key={index} className="break" />
        }
        return <p key={index}>{inline(line)}</p>
      })}
    </>
  )
}
