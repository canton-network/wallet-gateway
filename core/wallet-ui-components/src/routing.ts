// Copyright (c) 2025-2026 Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

export const ALLOWED_ROUTES = [
    '/login',
    '/parties/add',
    '/parties',
    '/wallets',
    '/settings',
    '/networks/add',
    '/networks/review',
    '/networks',
    '/identity-providers/add',
    '/identity-providers/review',
    '/identity-providers',
    '/activities',
    '/approve',
    '/sign-message',
    '/',
    '/404',
    '/callback',
] as const

export type AllowedRoute = (typeof ALLOWED_ROUTES)[number]

export function isAllowedRoute(path: string): path is AllowedRoute {
    return ALLOWED_ROUTES.includes(path as (typeof ALLOWED_ROUTES)[number])
}

const NON_ROOT_ROUTES = ALLOWED_ROUTES.filter(
    (route): route is Exclude<AllowedRoute, '/'> => route !== '/'
).sort((left, right) => right.length - left.length)

function normalizePathname(pathname: string): string {
    if (!pathname || pathname === '/') {
        return '/'
    }
    if (pathname.length > 1000) {
        throw new Error('Path is too long')
    }

    const trimmedPathname = pathname.replace(/\/+$/, '') || '/'

    if (trimmedPathname === '/index.html') {
        return '/'
    }

    if (trimmedPathname.endsWith('/index.html')) {
        return trimmedPathname.slice(0, -'/index.html'.length) || '/'
    }

    return trimmedPathname
}

export function getCurrentRoute(pathname: string): AllowedRoute | null {
    const normalizedPath = normalizePathname(pathname)

    if (normalizedPath === '/') {
        return '/'
    }

    for (const route of NON_ROOT_ROUTES) {
        if (normalizedPath === route || normalizedPath.endsWith(`${route}`)) {
            return route
        }
    }

    return null
}

function getGatewayBasePath(pathname: string): string {
    const normalizedPath = normalizePathname(pathname)
    const currentRoute = getCurrentRoute(normalizedPath)

    if (currentRoute === null || currentRoute === '/') {
        return normalizedPath === '/' ? '' : normalizedPath
    }

    const basePath = normalizedPath.slice(0, -currentRoute.length)
    return basePath || ''
}

export function toRelPath(
    path: string,
    pathname = window.location.pathname
): string {
    const basePath = getGatewayBasePath(pathname)
    const normalizedPath = path.startsWith('/') ? path : `/${path}`

    if (!basePath) {
        return normalizedPath
    }

    if (normalizedPath === '/') {
        return `${basePath}/`
    }

    return `${basePath}${normalizedPath}`
}

export function toRelHref(
    route: AllowedRoute,
    pathname = window.location.pathname
): string {
    if (route === '/') {
        return toRelPath('/', pathname)
    }

    return toRelPath(`${route}/`, pathname)
}
