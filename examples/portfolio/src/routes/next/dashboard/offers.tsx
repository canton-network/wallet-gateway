import { Typography } from '@mui/material'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/next/dashboard/offers')({
    component: RouteComponent,
})

function RouteComponent() {
    return (
        <Typography variant="h4" component="h1">
            /next/dashboard/offers
        </Typography>
    )
}
