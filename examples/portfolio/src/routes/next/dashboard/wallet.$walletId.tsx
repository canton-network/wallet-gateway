import { Typography } from '@mui/material'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/next/dashboard/wallet/$walletId')({
    component: RouteComponent,
})

function RouteComponent() {
    const { walletId } = Route.useParams()

    return (
        <Typography variant="h4" component="h1">
            {`/next/dashboard/wallet/${walletId}`}
        </Typography>
    )
}
