'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { addMonths, format as formatDate } from 'date-fns'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { createAssignment, updateAssignment } from './actions'
import { toast } from 'sonner'
import { Plus, Edit2 } from 'lucide-react'

// Basic types for the dropdowns
type SelectItem = { id: string, name: string }

export type Assignment = {
    id: string
    guard_id: string
    site_id: string
    start_date: string
    end_date: string | null
    shift_start_time: string
    shift_end_time: string
    payment_type?: string
    hourly_rate: number | null
    guards?: { full_name: string }
    sites?: { name: string }
}

export function AssignmentDialog({
    assignment,
    availableGuards,
    availableSites
}: {
    assignment?: Assignment,
    availableGuards: SelectItem[],
    availableSites: SelectItem[]
}) {
    const [open, setOpen] = useState(false)
    const isEditing = !!assignment

    // Controlled state for presets
    const [paymentType, setPaymentType] = useState(assignment?.payment_type || 'hourly')
    const [startDate, setStartDate] = useState(assignment?.start_date || '')
    const [endDate, setEndDate] = useState(assignment?.end_date || '')
    const [startTime, setStartTime] = useState(assignment?.shift_start_time ? assignment.shift_start_time.slice(0, 5) : '')
    const [endTime, setEndTime] = useState(assignment?.shift_end_time ? assignment.shift_end_time.slice(0, 5) : '')

    const setDatePreset = (months: number) => {
        const start = new Date()
        setStartDate(formatDate(start, 'yyyy-MM-dd'))
        const end = addMonths(start, months)
        setEndDate(formatDate(end, 'yyyy-MM-dd'))
    }

    const setTimePreset = (start: string, end: string) => {
        setStartTime(start)
        setEndTime(end)
    }

    const setDurationPreset = (hours: number) => {
        const start = startTime || '08:00'
        setStartTime(start)
        const [h, m] = start.split(':').map(Number)
        const endH = (h + hours) % 24
        setEndTime(`${endH.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`)
    }

    async function onSubmit(formData: FormData) {
        // Since we disabled the native select with our custom UI pattern or we append it
        // We ensure payment_type is in the form data
        formData.set('payment_type', paymentType)

        let result
        if (isEditing) {
            result = await updateAssignment(assignment.id, formData)
        } else {
            result = await createAssignment(formData)
        }

        if (result.success) {
            toast.success(isEditing ? 'Assignment updated.' : 'Assignment added.')
            setOpen(false)
        } else {
            toast.error(result.error || 'Operation failed')
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {isEditing ? (
                    <Button variant="ghost" size="icon">
                        <Edit2 className="h-4 w-4" />
                    </Button>
                ) : (
                    <Button>
                        <Plus className="h-4 w-4 mr-2" /> Assign Guard
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <form action={onSubmit}>
                    <DialogHeader>
                        <DialogTitle>{isEditing ? 'Edit Assignment' : 'Create Assignment'}</DialogTitle>
                        <DialogDescription>
                            Assign an active guard to an active site and define their shift.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">

                        <div className="grid gap-2">
                            <Label htmlFor="guard_id">Guard *</Label>
                            <Select name="guard_id" defaultValue={assignment?.guard_id} required>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a Guard" />
                                </SelectTrigger>
                                <SelectContent>
                                    {availableGuards.map(g => (
                                        <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="site_id">Site *</Label>
                            <Select name="site_id" defaultValue={assignment?.site_id} required>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a Site" />
                                </SelectTrigger>
                                <SelectContent>
                                    {availableSites.map(s => (
                                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-4 border rounded-lg p-3 bg-muted/10">
                            <div>
                                <Label className="text-xs text-muted-foreground uppercase mb-2 block">Quick Duration Presets</Label>
                                <div className="flex flex-wrap gap-2">
                                    <Button type="button" variant="outline" size="sm" onClick={() => setDatePreset(1)}>1 Month</Button>
                                    <Button type="button" variant="outline" size="sm" onClick={() => setDatePreset(3)}>3 Months</Button>
                                    <Button type="button" variant="outline" size="sm" onClick={() => setDatePreset(6)}>6 Months</Button>
                                    <Button type="button" variant="outline" size="sm" onClick={() => setDatePreset(12)}>1 Year</Button>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="start_date">Start Date *</Label>
                                    <Input
                                        id="start_date"
                                        name="start_date"
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="end_date">End Date (Optional)</Label>
                                    <Input
                                        id="end_date"
                                        name="end_date"
                                        type="date"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4 border rounded-lg p-3 bg-muted/10">
                            <div>
                                <Label className="text-xs text-muted-foreground uppercase mb-2 block">Quick Shift Presets</Label>
                                <div className="flex flex-wrap gap-2 mb-2">
                                    <Button type="button" variant="outline" size="sm" onClick={() => setTimePreset('08:00', '20:00')}>Day (08:00-20:00)</Button>
                                    <Button type="button" variant="outline" size="sm" onClick={() => setTimePreset('20:00', '08:00')}>Night (20:00-08:00)</Button>
                                    <Button type="button" variant="outline" size="sm" onClick={() => setTimePreset('08:00', '14:00')}>Morning Half</Button>
                                </div>
                                <div className="flex flex-wrap gap-2 mt-2">
                                    <Button type="button" variant="outline" size="sm" onClick={() => setDurationPreset(8)}>8 Hours</Button>
                                    <Button type="button" variant="outline" size="sm" onClick={() => setDurationPreset(10)}>10 Hours</Button>
                                    <Button type="button" variant="outline" size="sm" onClick={() => setDurationPreset(12)}>12 Hours</Button>
                                    <Button type="button" variant="outline" size="sm" onClick={() => setDurationPreset(4)}>Event (4h)</Button>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="shift_start_time">Shift Start *</Label>
                                    <Input
                                        id="shift_start_time"
                                        name="shift_start_time"
                                        type="time"
                                        value={startTime}
                                        onChange={(e) => setStartTime(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="shift_end_time">Shift End *</Label>
                                    <Input
                                        id="shift_end_time"
                                        name="shift_end_time"
                                        type="time"
                                        value={endTime}
                                        onChange={(e) => setEndTime(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border rounded-lg p-3 bg-muted/10">
                            <div className="grid gap-2">
                                <Label htmlFor="payment_type">Payment Type</Label>
                                <Select value={paymentType} onValueChange={setPaymentType}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="hourly">Hourly Rate</SelectItem>
                                        <SelectItem value="monthly">Monthly Salary</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="hourly_rate">
                                    {paymentType === 'hourly' ? 'Rate (₹/hr)' : 'Salary (₹/mo)'}
                                </Label>
                                <Input
                                    id="hourly_rate"
                                    name="hourly_rate"
                                    type="number"
                                    step="0.01"
                                    defaultValue={assignment?.hourly_rate || ''}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="ot_multiplier">OT Multiplier</Label>
                                <Input
                                    id="ot_multiplier"
                                    name="ot_multiplier"
                                    type="number"
                                    step="0.1"
                                    placeholder="e.g. 1.5"
                                    defaultValue={(assignment as any)?.ot_multiplier !== undefined ? (assignment as any).ot_multiplier : 1.5}
                                />
                            </div>
                        </div>

                    </div>
                    <DialogFooter>
                        <Button type="submit">Save changes</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
