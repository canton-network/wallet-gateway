// Copyright (c) 2025-2026 Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import { WalletPicker } from './components/wallet-picker'
import { WalletPickerCard } from './components/wallet-picker/components/card'
import { WalletPickerConnected } from './components/wallet-picker/components/connected'
import { WalletPickerConnecting } from './components/wallet-picker/components/connecting'
import { WalletPickerError } from './components/wallet-picker/components/error'
import { WalletPickerList } from './components/wallet-picker/components/list'

declare global {
    interface HTMLElementTagNameMap {
        'wallet-picker-error': WalletPickerError
        'wallet-picker-list': WalletPickerList
        'wallet-picker-connecting': WalletPickerConnecting
        'wallet-picker-connected': WalletPickerConnected
        'wallet-picker-card': WalletPickerCard
        'swk-wallet-picker': WalletPicker
    }
}
