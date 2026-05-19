import '../../App.css'
import { HoldingsTab } from '../../oldcomponents/HoldingsTab'
import { RegistriesTab } from '../../oldcomponents/RegistriesTab'
import { PendingTransfersTab } from '../../oldcomponents/PendingTransfersTab'
import { TwoStepTransferTab } from '../../oldcomponents/TwoStepTransferTab'
import { TransactionHistoryTab } from '../../oldcomponents/TransactionHistoryTab'
import { ConnectionCard } from '../../oldcomponents/ConnectionCard'
import { AllocationsTab } from '../../oldcomponents/AllocationsTab'
import { Tabs } from '../../oldcomponents/Tabs'

export function OldApp() {
    return (
        <>
            <h1>dApp Portfolio</h1>
            <ConnectionCard />
            <Tabs
                tabs={[
                    {
                        label: 'Holdings',
                        value: 'holdings',
                        content: <HoldingsTab />,
                    },
                    {
                        label: 'Transfer',
                        value: 'twoStepTransfer',
                        content: <TwoStepTransferTab />,
                    },
                    {
                        label: 'Pending Transfers',
                        value: 'pendingTransfers',
                        content: <PendingTransfersTab />,
                    },
                    {
                        label: 'Transaction History',
                        value: 'transactionHistory',
                        content: <TransactionHistoryTab />,
                    },
                    {
                        label: 'Allocations',
                        value: 'allocations',
                        content: <AllocationsTab />,
                    },
                    {
                        label: 'Registry Settings',
                        value: 'registries',
                        content: <RegistriesTab />,
                    },
                ]}
            />
        </>
    )
}
