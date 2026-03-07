'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Camera, MapPin, Loader2, LogOut } from 'lucide-react'
import { toast } from 'sonner'
import imageCompression from 'browser-image-compression'
import { useSyncStore } from '@/store/sync-store'

interface Props {
    guardId: string
    assignmentId: string
    siteId: string
    siteName: string
    isAlreadyCheckedIn: boolean
    attendanceId?: string // If checking out, we need the record ID
}

export function CheckInClient({ guardId, assignmentId, siteId, siteName, isAlreadyCheckedIn, attendanceId }: Props) {
    const [isCheckingIn, setIsCheckingIn] = useState(false)
    const [previewUrl, setPreviewUrl] = useState<string | null>(null)
    const [compressedBase64, setCompressedBase64] = useState<string | null>(null)
    const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null)

    const fileInputRef = useRef<HTMLInputElement>(null)
    const addSyncJob = useSyncStore(state => state.addJob)

    const handleCaptureClick = () => {
        fileInputRef.current?.click()
    }

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setIsCheckingIn(true)
        try {
            // Compress image aggressively
            const options = {
                maxSizeMB: 0.1, // 100kb limit
                maxWidthOrHeight: 800,
                useWebWorker: true,
                fileType: 'image/jpeg'
            }
            const compressedFile = await imageCompression(file, options)

            // Create preview
            const preview = URL.createObjectURL(compressedFile)
            setPreviewUrl(preview)

            // Convert to Base64 strictly for offline storage capacity
            const reader = new FileReader()
            reader.readAsDataURL(compressedFile)
            reader.onloadend = () => {
                setCompressedBase64(reader.result as string)
            }

            // Get GPS (High Accuracy fallback to Low Accuracy)
            toast.info('Acquiring high-accuracy GPS location...')

            const getPos = (highAccuracy: boolean) => {
                navigator.geolocation.getCurrentPosition(
                    (pos) => {
                        setLocation({
                            lat: pos.coords.latitude,
                            lng: pos.coords.longitude
                        })
                        setIsCheckingIn(false)
                        toast.success('Selfie and GPS acquired!')
                    },
                    (err) => {
                        console.error('GPS Error:', err)
                        // Error code 3 is TIMEOUT
                        if (highAccuracy && err.code === 3) {
                            toast.info('High accuracy timed out. Trying standard accuracy...')
                            getPos(false)
                        } else {
                            toast.error(err.message || 'Failed to get location. Please enable OS GPS permissions.')
                            setIsCheckingIn(false)
                        }
                    },
                    { enableHighAccuracy: highAccuracy, timeout: highAccuracy ? 10000 : 5000, maximumAge: 0 }
                )
            }

            getPos(true)

        } catch (error) {
            console.error(error)
            toast.error('Failed to process image.')
            setIsCheckingIn(false)
        }
    }

    const handleSubmit = async () => {
        if (!compressedBase64 || !location) {
            toast.error('Missing selfie or location.')
            return
        }

        const deviceTimestamp = new Date().toISOString()
        const jobId = crypto.randomUUID()

        // Build the payload
        // Note: For check-out, we would need a different structure, but keeping it unified for MVP sync
        // Depending on `isAlreadyCheckedIn`, the endpoint behavior handles it.
        const payload = isAlreadyCheckedIn ? {
            id: attendanceId,
            check_out_time: deviceTimestamp,
            check_out_lat: location.lat,
            check_out_lng: location.lng,
            selfieBase64: compressedBase64,
            guard_id: guardId,
            site_id: siteId,
            assignment_id: assignmentId,
            deviceTimestamp,
            type: 'check_out'
        } : {
            check_in_time: deviceTimestamp,
            check_in_lat: location.lat,
            check_in_lng: location.lng,
            selfieBase64: compressedBase64,
            guard_id: guardId,
            site_id: siteId,
            assignment_id: assignmentId,
            deviceTimestamp,
            status: 'present',
            type: 'check_in'
        }

        addSyncJob({
            id: jobId,
            type: isAlreadyCheckedIn ? 'ATTENDANCE_CHECK_OUT' : 'ATTENDANCE_CHECK_IN',
            payload,
            deviceTimestamp
        })

        toast.success(`${isAlreadyCheckedIn ? 'Check-out' : 'Check-in'} recorded! Syncing...`)
        setPreviewUrl(null)
        setCompressedBase64(null)
        setLocation(null)
    }

    return (
        <div className="flex flex-col h-full bg-[#012f6b] rounded-3xl p-6 border border-[#024a8f] shadow-xl relative overflow-hidden">
            {/* Ambient Background Glow based on status */}
            <div className={`absolute -top-32 -left-32 w-64 h-64 rounded-full blur-3xl opacity-20 pointer-events-none ${isAlreadyCheckedIn ? 'bg-orange-500' : 'bg-kavach-orange'}`} />

            <div className="relative z-10 flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-2xl font-bold text-white tracking-tight">{siteName}</h2>
                    <p className="text-neutral-400 mt-1">Current Assignment</p>
                </div>
                <div className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${isAlreadyCheckedIn ? 'bg-orange-500/10 text-orange-500 border border-orange-500/20' : 'bg-kavach-orange/10 text-kavach-orange border border-kavach-orange/20'}`}>
                    {isAlreadyCheckedIn ? 'Active Shift' : 'Pending Start'}
                </div>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center relative z-10">
                <input
                    type="file"
                    accept="image/*"
                    capture="user"
                    ref={fileInputRef}
                    className="hidden"
                    onChange={handleFileChange}
                />

                {!previewUrl ? (
                    <button
                        onClick={handleCaptureClick}
                        disabled={isCheckingIn}
                        className={`group relative w-64 h-64 rounded-full flex flex-col items-center justify-center transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-2xl ${isAlreadyCheckedIn
                                ? 'bg-gradient-to-br from-orange-500 to-red-600 hover:shadow-orange-500/25 border-4 border-neutral-900 ring-4 ring-orange-500/30'
                                : 'bg-gradient-to-br from-kavach-orange to-kavach-orange hover:shadow-kavach-orange/25 border-4 border-neutral-900 ring-4 ring-kavach-orange/30'
                            }`}
                    >
                        {isCheckingIn ? (
                            <Loader2 className="animate-spin h-12 w-12 text-white mb-4" />
                        ) : isAlreadyCheckedIn ? (
                            <LogOut className="h-12 w-12 text-white mb-4 group-hover:-translate-y-1 transition-transform" />
                        ) : (
                            <Camera className="h-12 w-12 text-white mb-4 group-hover:-translate-y-1 transition-transform" />
                        )}
                        <span className="text-white font-bold text-xl tracking-wide uppercase">
                            {isCheckingIn ? 'Processing...' : isAlreadyCheckedIn ? 'Check Out' : 'Check In'}
                        </span>
                    </button>
                ) : (
                    <div className="w-full flex flex-col items-center gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="relative">
                            <img src={previewUrl} alt="Selfie Preview" className="w-48 h-48 object-cover rounded-full border-4 border-[#024a8f] shadow-2xl" />
                            <div className="absolute -bottom-2 -right-2 bg-neutral-800 p-2 rounded-full border border-neutral-700">
                                <span className="text-xl">📸</span>
                            </div>
                        </div>

                        <div className="bg-kavach-navy px-4 py-2 rounded-xl flex items-center border border-[#024a8f] shadow-inner">
                            <MapPin className="h-4 w-4 text-kavach-orange mr-2" />
                            <span className="text-sm font-mono text-neutral-300">
                                {location ? `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}` : 'Acquiring GPS...'}
                            </span>
                        </div>

                        <div className="flex gap-3 w-full max-w-xs mt-4">
                            <Button
                                variant="outline"
                                className="flex-1 bg-neutral-800 border-neutral-700 text-neutral-300 hover:bg-neutral-700 hover:text-white h-14 rounded-2xl"
                                onClick={() => setPreviewUrl(null)}
                            >
                                Retake
                            </Button>
                            <Button
                                className={`flex-1 h-14 rounded-2xl font-bold text-white shadow-lg ${isAlreadyCheckedIn ? 'bg-orange-600 hover:bg-orange-500 shadow-orange-900/50' : 'bg-kavach-orange hover:bg-kavach-orange shadow-kavach-orange/50'}`}
                                onClick={handleSubmit}
                                disabled={!location}
                            >
                                Confirm
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            <p className="text-center text-xs text-neutral-500 mt-8 relative z-10 flex items-center justify-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-neutral-500" />
                Live location required for operations
            </p>
        </div>
    )
}


