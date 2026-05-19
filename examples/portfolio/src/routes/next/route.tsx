import { Outlet, createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/next')({
    component: NextLayout,
})

function NextLayout() {
    return <Outlet />
}
