'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { X, Download } from 'lucide-react'

// Interface for the BeforeInstallPromptEvent which isn't standard in TS DOM yet
interface BeforeInstallPromptEvent extends Event {
    readonly platforms: Array<string>;
    readonly userChoice: Promise<{
        outcome: 'accepted' | 'dismissed',
        platform: string
    }>;
    prompt(): Promise<void>;
}

export function PWAInstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
    const [isInstallable, setIsInstallable] = useState(false)
    const [isDismissed, setIsDismissed] = useState(false)

    useEffect(() => {
        // Only run on client
        if (typeof window === 'undefined') return

        const handler = (e: Event) => {
            // Prevent the mini-infobar from appearing on mobile
            e.preventDefault()
            
            // Stash the event so it can be triggered later.
            setDeferredPrompt(e as BeforeInstallPromptEvent)
            setIsInstallable(true)
        }

        window.addEventListener('beforeinstallprompt', handler)

        // Check if already installed
        window.addEventListener('appinstalled', () => {
            setIsInstallable(false)
            setDeferredPrompt(null)
        })

        return () => {
            window.removeEventListener('beforeinstallprompt', handler)
        }
    }, [])

    const handleInstallClick = async () => {
        if (!deferredPrompt) return

        // Show the install prompt
        deferredPrompt.prompt()

        // Wait for the user to respond to the prompt
        const { outcome } = await deferredPrompt.userChoice
        
        // Optionally, send analytics event with outcome of user choice
        console.log(`User response to the install prompt: ${outcome}`)

        // We've used the prompt, and can't use it again, throw it away
        setDeferredPrompt(null)
        setIsInstallable(false)
    }

    if (!isInstallable || isDismissed) return null

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 p-4 pb-8 md:pb-4 pointer-events-none fade-in slide-in-from-bottom flex justify-center">
            <div className="bg-neutral-900 border border-neutral-800 shadow-2xl rounded-2xl p-4 w-full max-w-sm pointer-events-auto flex flex-col gap-3 relative overflow-hidden backdrop-blur-xl bg-opacity-95">
                <button 
                    onClick={() => setIsDismissed(true)} 
                    className="absolute top-3 right-3 text-neutral-400 hover:text-white transition-colors"
                >
                    <X className="h-4 w-4" />
                </button>
                
                <div className="flex items-center gap-4">
                    <img src="/logo.png" alt="Kavach App" className="w-12 h-12 object-contain rounded-lg shrink-0" />
                    <div>
                        <h4 className="font-bold text-white text-sm">Install Kavach App</h4>
                        <p className="text-xs text-neutral-400 leading-snug mt-0.5">
                            Get quick access, offline sync, and push notifications.
                        </p>
                    </div>
                </div>
                
                <Button 
                    onClick={handleInstallClick} 
                    className="w-full bg-kavach-navy hover:bg-[#024a8f] text-white font-semibold rounded-xl"
                >
                    <Download className="w-4 h-4 mr-2" />
                    Install Now
                </Button>
            </div>
        </div>
    )
}
