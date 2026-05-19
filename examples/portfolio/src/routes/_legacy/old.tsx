import { createFileRoute } from '@tanstack/react-router'
import { OldApp } from './old.component'

export const Route = createFileRoute('/_legacy/old')({
    component: OldApp,
})
