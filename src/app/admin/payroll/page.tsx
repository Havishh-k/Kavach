import { getPayrollConfigs, getMonthlyGrossPaySummary } from './actions'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { PayRateDialog } from './pay-rate-dialog'

export default async function PayrollPage() {
    const guardsConf = await getPayrollConfigs()
    const summary = await getMonthlyGrossPaySummary()

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Payroll & Reporting</h2>
                    <p className="text-muted-foreground">
                        Configure hourly rates and view automated overtime calculations.
                    </p>
                </div>
                {/* Future implementation: Excel Export Button here */}
                <a
                    href="/api/export"
                    download
                    className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium h-9 px-4 py-2 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                    Export Excel
                </a>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Payroll Configuration */}
                <Card>
                    <CardHeader>
                        <CardTitle>Pay Rate Configuration</CardTitle>
                        <CardDescription>Set base rates and OT multipliers per guard.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Guard Name</TableHead>
                                    <TableHead>Base Rate</TableHead>
                                    <TableHead>OT Multiplier</TableHead>
                                    <TableHead className="text-right">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {guardsConf.map(guard => {
                                    const config = Array.isArray(guard.payroll_config)
                                        ? guard.payroll_config[0]
                                        : guard.payroll_config

                                    return (
                                        <TableRow key={guard.id}>
                                            <TableCell className="font-medium">{guard.full_name}</TableCell>
                                            <TableCell>
                                                {config?.base_hourly_rate ? `₹${config.base_hourly_rate}/hr` : <span className="text-muted-foreground">Not Set</span>}
                                            </TableCell>
                                            <TableCell>{config?.ot_multiplier || 1.5}x</TableCell>
                                            <TableCell className="text-right">
                                                <PayRateDialog guard={guard} />
                                            </TableCell>
                                        </TableRow>
                                    )
                                })}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {/* Gross Pay Summary */}
                <Card>
                    <CardHeader>
                        <CardTitle>Current Period Summary</CardTitle>
                        <CardDescription>Aggregated regular and OT hours (Live).</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Guard</TableHead>
                                    <TableHead className="text-right">Regular Hrs</TableHead>
                                    <TableHead className="text-right">OT Hrs</TableHead>
                                    <TableHead className="text-right">Gross Pay</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {summary.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                                            No check-outs recorded yet.
                                        </TableCell>
                                    </TableRow>
                                ) : summary.map((s, idx) => (
                                    <TableRow key={idx}>
                                        <TableCell className="font-medium">{s.full_name}</TableCell>
                                        <TableCell className="text-right">{s.total_regular_hours.toFixed(2)}h</TableCell>
                                        <TableCell className="text-right text-orange-600">{s.total_ot_hours.toFixed(2)}h</TableCell>
                                        <TableCell className="text-right font-bold text-emerald-600">
                                            ₹{s.gross_pay.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

            </div>
        </div>
    )
}
