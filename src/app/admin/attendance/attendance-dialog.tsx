import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Map, Camera, Clock, Signal, Info, ExternalLink } from 'lucide-react'
import { format } from 'date-fns'
import { Badge } from '@/components/ui/badge'

interface AttendanceRecord {
    id: string
    check_in_time: string
    check_out_time: string | null
    check_in_selfie_url: string
    check_out_selfie_url: string | null
    status: string
    is_offline_sync: boolean
    check_in_lat?: number | null
    check_in_lng?: number | null
    check_out_lat?: number | null
    check_out_lng?: number | null
    guards?: { id: string, full_name: string } | null
    sites?: { id: string, name: string } | null
}

interface DialogProps {
    record: AttendanceRecord
}

export function AttendanceDialog({ record }: DialogProps) {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="transition-opacity">
                    <Map className="h-4 w-4 mr-2" />
                    View Data
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Verification Details</DialogTitle>
                    <DialogDescription>
                        Audit log for {record.guards?.full_name} at {record.sites?.name || 'Unknown Site'}
                    </DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">

                    {/* Check In Details */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 border-b border-border pb-2">
                            <h3 className="font-semibold text-lg text-kavach-orange">Check-In</h3>
                            {record.is_offline_sync && <Badge variant="secondary" className="text-[10px] h-5 bg-amber-100 text-amber-800">Offline Sync</Badge>}
                        </div>

                        <div className="h-64 sm:aspect-square bg-muted rounded-xl border border-border overflow-hidden relative group">
                            {record.check_in_selfie_url ? (
                                <img
                                    src={record.check_in_selfie_url}
                                    alt="Check In Selfie"
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground">
                                    <Camera className="h-8 w-8 mb-2 opacity-20" />
                                    <span className="text-sm">No Selfie Recorded</span>
                                </div>
                            )}
                        </div>

                        <div className="space-y-2 text-sm bg-muted/30 p-3 rounded-lg border border-border">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" /> Time</span>
                                <span className="font-medium">{format(new Date(record.check_in_time), 'PPp')}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground flex items-center gap-1"><Map className="h-3 w-3" /> GPS</span>
                                <span className="font-medium text-blue-600">
                                    {record.check_in_lat && record.check_in_lng ? (
                                        <a
                                            href={`https://www.google.com/maps/search/?api=1&query=${record.check_in_lat},${record.check_in_lng}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="hover:underline transition-all underline-offset-2 flex items-center gap-1"
                                        >
                                            {`${record.check_in_lat.toFixed(4)}, ${record.check_in_lng.toFixed(4)}`}
                                            <ExternalLink className="h-3 w-3 shrink-0" />
                                        </a>
                                    ) : (
                                        'Not Acquired'
                                    )}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Check Out Details */}
                    <div className="space-y-4 opacity-75 hover:opacity-100 transition-opacity">
                        <div className="flex items-center gap-2 border-b border-border pb-2">
                            <h3 className="font-semibold text-lg text-orange-700">Check-Out</h3>
                            {!record.check_out_time && <Badge variant="outline" className="text-[10px] h-5">Pending</Badge>}
                        </div>

                        <div className="h-64 sm:aspect-square bg-muted rounded-xl border border-border overflow-hidden relative group">
                            {record.check_out_selfie_url ? (
                                <img
                                    src={record.check_out_selfie_url}
                                    alt="Check Out Selfie"
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground">
                                    {record.check_out_time ? (
                                        <Camera className="h-8 w-8 mb-2 opacity-20" />
                                    ) : (
                                        <Clock className="h-8 w-8 mb-2 opacity-20" />
                                    )}
                                    <span className="text-sm">
                                        {record.check_out_time ? 'No Selfie Found' : 'Awaiting Check-Out...'}
                                    </span>
                                </div>
                            )}
                        </div>

                        {record.check_out_time ? (
                            <div className="space-y-2 text-sm bg-muted/30 p-3 rounded-lg border border-border">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" /> Time</span>
                                    <span className="font-medium">{format(new Date(record.check_out_time), 'PPp')}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground flex items-center gap-1"><Map className="h-3 w-3" /> GPS</span>
                                    <span className="font-medium text-blue-600">
                                        {record.check_out_lat && record.check_out_lng ? (
                                            <a
                                                href={`https://www.google.com/maps/search/?api=1&query=${record.check_out_lat},${record.check_out_lng}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="hover:underline transition-all underline-offset-2 flex items-center gap-1"
                                            >
                                                {`${record.check_out_lat.toFixed(4)}, ${record.check_out_lng.toFixed(4)}`}
                                                <ExternalLink className="h-3 w-3 shrink-0" />
                                            </a>
                                        ) : (
                                            'Not Acquired'
                                        )}
                                    </span>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center justify-center h-[88px] text-sm text-muted-foreground bg-muted/10 rounded-lg border border-border border-dashed">
                                Shift is currently active
                            </div>
                        )}
                    </div>

                </div>

                <div className="bg-blue-50 text-blue-800 text-xs p-3 rounded-lg flex items-start gap-2 border border-blue-100 mt-2">
                    <Info className="h-4 w-4 shrink-0 mt-0.5" />
                    <p>
                        <strong>Verification Note:</strong> Click coordinates to view exact location on Google Maps.
                    </p>
                </div>
            </DialogContent>
        </Dialog>
    )
}

