import { getAssignments } from './actions'
import { getGuards } from '../guards/actions'
import { getSites } from '../sites/actions'
import { AssignmentsClient } from './assignments-client'

export const dynamic = 'force-dynamic'

export default async function AssignmentsPage() {
    const [assignments, guards, sites] = await Promise.all([
        getAssignments(),
        getGuards(),
        getSites(),
    ])

    // Map into SelectItem lists for the dialog dropdowns
    const availableGuards = guards.map((g: any) => ({ id: g.id, name: g.full_name }))
    const availableSites = sites.map((s: any) => ({ id: s.id, name: s.name }))

    return (
        <AssignmentsClient
            assignments={assignments}
            availableGuards={availableGuards}
            availableSites={availableSites}
        />
    )
}
