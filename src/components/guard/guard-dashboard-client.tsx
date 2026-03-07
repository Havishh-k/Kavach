'use client'

import { useState } from 'react'
import { MapPin, CalendarDays, UserSquare2, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Props {
    guardName: string
    checkInTab: React.ReactNode
    rosterTab: React.ReactNode
    settingsTab: React.ReactNode
    onLogout: () => void
}

export function GuardDashboardClient({ guardName, checkInTab, rosterTab, settingsTab, onLogout }: Props) {
    const [activeTab, setActiveTab] = useState<'checkin' | 'roster' | 'settings'>('checkin')

    return (
        <div className="h-screen w-full bg-neutral-950 text-neutral-50 flex flex-col relative overflow-hidden">
            {/* Top Header - Kept extremely minimal for focus */}
            <header className="px-6 pt-8 pb-4 bg-neutral-900 border-b border-neutral-800 flex justify-between items-center z-10">
                <div>
                    <img src="/logo.png" alt="Kavach Group" className="h-8 w-auto mb-2 object-contain" />
                    <h1 className="text-xl font-bold tracking-tight text-white mb-0.5">Hello, {guardName.split(' ')[0]}</h1>
                    <p className="text-sm text-emerald-500 font-medium tracking-wide flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Online
                    </p>
                </div>
                {activeTab === 'settings' && (
                    <Button variant="ghost" size="sm" onClick={onLogout} className="text-red-400 hover:text-red-300 hover:bg-neutral-800">
                        <LogOut className="w-4 h-4 mr-2" />
                        Sign Out
                    </Button>
                )}
            </header>

            {/* Scrollable Content Area */}
            <main className="flex-1 overflow-y-auto pb-24 p-4 z-0">
                <style dangerouslySetInnerHTML={{
                    __html: `
                    /* Hide scrollbar for Chrome, Safari and Opera */
                    main::-webkit-scrollbar { display: none; }
                    /* Hide scrollbar for IE, Edge and Firefox */
                    main { -ms-overflow-style: none; scrollbar-width: none; }
                `}} />

                <div className={`transition-opacity duration-300 ${activeTab === 'checkin' ? 'opacity-100 flex flex-col h-full' : 'hidden opacity-0'}`}>
                    {checkInTab}
                </div>
                <div className={`transition-opacity duration-300 ${activeTab === 'roster' ? 'opacity-100' : 'hidden opacity-0'}`}>
                    <h2 className="text-2xl font-bold text-white mb-6 pt-2">Your Roster</h2>
                    {rosterTab}
                </div>
                <div className={`transition-opacity duration-300 ${activeTab === 'settings' ? 'opacity-100' : 'hidden opacity-0'}`}>
                    <h2 className="text-2xl font-bold text-white mb-6 pt-2">Settings</h2>
                    <div className="bg-neutral-900 p-6 rounded-2xl border border-neutral-800">
                        {settingsTab}
                    </div>
                </div>
            </main>

            {/* Bottom Navigation Bar */}
            <nav className="absolute bottom-0 w-full bg-neutral-900/95 backdrop-blur-md border-t border-neutral-800 px-6 py-4 flex justify-between items-center z-50">
                <button
                    onClick={() => setActiveTab('checkin')}
                    className={`flex flex-col items-center gap-1.5 transition-colors ${activeTab === 'checkin' ? 'text-emerald-500' : 'text-neutral-500'}`}
                >
                    <MapPin className="w-6 h-6" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Check In</span>
                </button>
                <button
                    onClick={() => setActiveTab('roster')}
                    className={`flex flex-col items-center gap-1.5 transition-colors ${activeTab === 'roster' ? 'text-emerald-500' : 'text-neutral-500'}`}
                >
                    <CalendarDays className="w-6 h-6" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Roster</span>
                </button>
                <button
                    onClick={() => setActiveTab('settings')}
                    className={`flex flex-col items-center gap-1.5 transition-colors ${activeTab === 'settings' ? 'text-emerald-500' : 'text-neutral-500'}`}
                >
                    <UserSquare2 className="w-6 h-6" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Profile</span>
                </button>
            </nav>
        </div>
    )
}
