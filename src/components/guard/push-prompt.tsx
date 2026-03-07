'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Bell } from 'lucide-react'
import { savePushSubscription } from '@/app/guard/actions'
import { toast } from 'sonner'

export function PushNotificationPrompt({ guardId }: { guardId: string }) {
    const [isStandalone, setIsStandalone] = useState(false)
    const [permission, setPermission] = useState<NotificationPermission>('default')
    const [isLoading, setIsLoading] = useState(false)

    // Replace this with your actual VAPID Public Key once generated
    const PUBLIC_VAPID_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''

    // Base64Url to Uint8Array converter
    function urlBase64ToUint8Array(base64String: string) {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding)
            .replace(/\-/g, '+')
            .replace(/_/g, '/');

        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);

        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
    }

    useEffect(() => {
        // Only prompt if running as an installed PWA (Standalone)
        // This prevents immediate permission popups on standard web visits
        if (typeof window !== 'undefined') {
            const isPwa = window.matchMedia('(display-mode: standalone)').matches
                || (window.navigator as any).standalone
                || document.referrer.includes('android-app://');

            setIsStandalone(isPwa)

            if ('Notification' in window) {
                setPermission(Notification.permission)
            }
        }
    }, [])

    const subscribeToPush = async () => {
        setIsLoading(true)
        try {
            if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
                toast.error('Push notifications are not supported in this browser.')
                return;
            }

            if (!PUBLIC_VAPID_KEY) {
                toast.error('VAPID public key not configured yet.')
                return;
            }

            // Explicitly register the service worker if not already registered
            await navigator.serviceWorker.register('/sw.js')
            const registration = await navigator.serviceWorker.ready;

            // Ask for permission explicitly
            const perm = await Notification.requestPermission()
            setPermission(perm)

            if (perm !== 'granted') {
                toast.error('Notification permission denied.')
                return;
            }

            // Subscribe via the Service Worker
            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(PUBLIC_VAPID_KEY)
            });

            // Save the subscription to our Supabase database via Server Action
            const result = await savePushSubscription(guardId, JSON.parse(JSON.stringify(subscription)));

            if (result.success) {
                toast.success('Successfully subscribed to shift reminders!')
            } else {
                toast.error('Failed to save subscription: ' + result.error)
            }
        } catch (error) {
            console.error('Error subscribing to push:', error);
            toast.error('Something went wrong configuring notifications.')
        } finally {
            setIsLoading(false)
        }
    }

    if (!isStandalone) {
        // In dev, you might want to remove this `return null` to test it in regular Chrome tabs
        // return null; 
    }

    if (permission === 'granted' || permission === 'denied') {
        return null;
    }

    return (
        <div className="bg-primary/5 border border-primary/20 p-4 rounded-xl flex items-center justify-between shadow-sm mt-4">
            <div className="flex items-center gap-3">
                <div className="bg-primary/10 p-2 rounded-full">
                    <Bell className="h-5 w-5 text-primary" />
                </div>
                <div>
                    <h4 className="font-semibold text-sm text-gray-900">Enable Shift Alerts</h4>
                    <p className="text-xs text-gray-500">Get notified 30 mins before your shift.</p>
                </div>
            </div>
            <Button size="sm" onClick={subscribeToPush} disabled={isLoading}>
                {isLoading ? 'Wait...' : 'Enable'}
            </Button>
        </div>
    )
}
