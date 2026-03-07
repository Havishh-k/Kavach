'use client'

import { useState } from 'react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { MapPin, Calendar, Clock, Contact } from 'lucide-react'

interface Assignment {
    id: string
    start_date: string
    end_date: string | null
    shift_start_time: string
    shift_end_time: string
    sites?: {
        name: string
        address: string
        contact_person: string
        contact_phone: string
    }
}

interface RosterClientProps {
    assignments: Assignment[]
    activeAssignmentId?: string
}

export function RosterClient({ assignments, activeAssignmentId }: RosterClientProps) {
    const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null)

    if (!assignments || assignments.length === 0) {
        return <div className="text-sm text-gray-500 bg-white p-4 rounded-xl border border-border">No assignments found.</div>
    }

    // Helper to format time strings (e.g. "09:00:00" -> "9:00 AM")
    const formatTime = (timeStr: string) => {
        try {
            const [h, m] = timeStr.split(':')
            const d = new Date()
            d.setHours(parseInt(h, 10), parseInt(m, 10))
            return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
        } catch {
            return timeStr
        }
    }

    return (
        <div className="space-y-3">
            {assignments.map(a => (
                <div
                    key={a.id}
                    onClick={() => setSelectedAssignment(a)}
                    className="bg-white p-4 rounded-xl shadow-sm border border-border flex justify-between items-center cursor-pointer hover:bg-gray-50 transition-colors"
                >
                    <div>
                        <p className="font-semibold text-gray-800">{a.sites?.name || 'Unknown Site'}</p>
                        <p className="text-xs text-gray-500">
                            {new Date(a.start_date).toLocaleDateString()} - {a.end_date ? new Date(a.end_date).toLocaleDateString() : 'Ongoing'}
                        </p>
                    </div>
                    <div className={`px-2 py-1 rounded text-xs shrink-0 ml-2 ${activeAssignmentId === a.id ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                        {activeAssignmentId === a.id ? 'Current' : 'Scheduled'}
                    </div>
                </div>
            ))}

            <Dialog open={!!selectedAssignment} onOpenChange={(open) => !open && setSelectedAssignment(null)}>
                <DialogContent className="max-w-sm rounded-xl">
                    <DialogHeader>
                        <DialogTitle>{selectedAssignment?.sites?.name}</DialogTitle>
                    </DialogHeader>

                    {selectedAssignment && (
                        <div className="space-y-4 pt-4">
                            <div className="flex items-start gap-3 text-sm text-gray-700">
                                <MapPin className="h-5 w-5 text-gray-400 shrink-0" />
                                <span>{selectedAssignment.sites?.address || 'No address provided'}</span>
                            </div>

                            <div className="flex items-start gap-3 text-sm text-gray-700">
                                <Calendar className="h-5 w-5 text-gray-400 shrink-0" />
                                <div>
                                    <p className="font-medium">Dates:</p>
                                    <p>
                                        {new Date(selectedAssignment.start_date).toLocaleDateString()} to {selectedAssignment.end_date ? new Date(selectedAssignment.end_date).toLocaleDateString() : 'Ongoing'}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3 text-sm text-gray-700">
                                <Clock className="h-5 w-5 text-gray-400 shrink-0" />
                                <div>
                                    <p className="font-medium">Shift Timings:</p>
                                    <p>
                                        {formatTime(selectedAssignment.shift_start_time)} - {formatTime(selectedAssignment.shift_end_time)}
                                    </p>
                                </div>
                            </div>

                            {selectedAssignment.sites?.contact_person && (
                                <div className="flex items-start gap-3 text-sm text-gray-700">
                                    <Contact className="h-5 w-5 text-gray-400 shrink-0" />
                                    <div>
                                        <p className="font-medium">Site Contact:</p>
                                        <p>{selectedAssignment.sites.contact_person}</p>
                                        {selectedAssignment.sites.contact_phone && (
                                            <p className="text-gray-500">{selectedAssignment.sites.contact_phone}</p>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}
