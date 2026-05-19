// Copyright (c) 2025-2026 Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

// A wrapper around reassigning window.location.href, to make it possible to mock and spy on it in unit tests
export function setLocationHref(href: string): void {
    window.location.href = href
}
