import { type ReactNode } from "react"
import ToolHeader from "./ToolHeader"

type Props = {
  title: string
  description: string
  eyebrow?: string
  actions?: ReactNode
  children: ReactNode
}

export default function ToolPageLayout({ title, description, eyebrow, actions, children }: Props) {
  return (
    <div className="flex flex-col gap-8">
      <ToolHeader title={title} description={description} eyebrow={eyebrow} actions={actions} />
      {children}
    </div>
  )
}
