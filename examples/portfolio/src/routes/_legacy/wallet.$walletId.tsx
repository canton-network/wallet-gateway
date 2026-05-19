// Copyright (c) 2025-2026 Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import { createFileRoute } from '@tanstack/react-router'
import { WalletDetailPage } from './wallet.$walletId.component'

export const Route = createFileRoute('/_legacy/wallet/$walletId')({
    component: WalletDetailPage,
})
