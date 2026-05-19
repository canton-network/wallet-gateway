import { createFileRoute } from '@tanstack/react-router'
import { Index } from './index.component'

export const Route = createFileRoute('/_legacy/')({
    component: Index,
})
