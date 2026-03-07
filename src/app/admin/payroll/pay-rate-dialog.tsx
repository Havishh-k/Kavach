'use client'

import { useState } from 'react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Settings2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
// Import the server action directly (will be passed as a prop or imported if standard server action)
// In Next.js 14+ we can just import server actions into client components
import { upsertPayrollConfig } from './actions'

interface Props {
    guard: any
}

export function PayRateDialog({ guard }: Props) {
    const router = useRouter()
    const [open, setOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)

    // Handle nested array response from Supabase Join
    const config = Array.isArray(guard.payroll_config)
        ? guard.payroll_config[0]
        : guard.payroll_config

    const defaultPaymentType = config?.payment_type || 'hourly'
    const defaultHourlyRate = config?.base_hourly_rate || ''
    const defaultMonthlyRate = config?.base_monthly_rate || ''
    const defaultOT = config?.ot_multiplier || 1.5

    const [paymentType, setPaymentType] = useState(defaultPaymentType)

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setIsLoading(true)

        try {
            const formData = new FormData(e.currentTarget)

            const rateInput = parseFloat(formData.get('rateInput') as string) || 0
            const ot = parseFloat(formData.get('otMultiplier') as string) || 1.5

            let baseRate = 0
            let baseMonthlyRate = 0

            if (paymentType === 'hourly') {
                baseRate = rateInput
            } else {
                baseMonthlyRate = rateInput
            }

            const result = await upsertPayrollConfig(guard.id, baseRate, ot, paymentType, baseMonthlyRate)

            if (result.error) throw new Error(result.error)

            toast.success(`Rates updated for ${guard.full_name}`)
            setOpen(false)
            router.refresh()
        } catch (error: any) {
            toast.error(error.message || 'Failed to update rates')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="sm">
                    <Settings2 className="h-4 w-4 mr-2" />
                    Configure Rates
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Configure Pay Rates</DialogTitle>
                    <DialogDescription>
                        Set the base hourly rate and OT multiplier for {guard.full_name}.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>Payment Structure</Label>
                        <Select value={paymentType} onValueChange={setPaymentType}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="hourly">Hourly Rate</SelectItem>
                                <SelectItem value="monthly">Monthly Salary</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="rateInput">
                            {paymentType === 'hourly' ? 'Base Hourly Rate (₹)' : 'Monthly Salary (₹)'}
                        </Label>
                        <Input
                            id="rateInput"
                            name="rateInput"
                            type="number"
                            step="0.01"
                            placeholder={paymentType === 'hourly' ? "e.g. 150.00" : "e.g. 15000.00"}
                            defaultValue={paymentType === 'hourly' ? defaultHourlyRate : defaultMonthlyRate}
                            required
                        />
                    </div>

                    <div className="space-y-2 bg-blue-50/50 p-4 rounded-lg border border-blue-100">
                        <Label htmlFor="otMultiplier">Overtime Multiplier</Label>
                        <Input
                            id="otMultiplier"
                            name="otMultiplier"
                            type="number"
                            step="0.1"
                            placeholder="e.g. 1.5"
                            defaultValue={defaultOT}
                            required
                        />
                        <p className="text-[10px] text-muted-foreground mt-1">
                            Applies to hours worked beyond 8hrs/day or 48hrs/week.
                        </p>
                    </div>

                    <DialogFooter>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Config
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
