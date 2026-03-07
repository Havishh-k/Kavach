import { login } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ShieldCheck, LockKeyhole } from 'lucide-react'

export default async function LoginPage({
    searchParams,
}: {
    searchParams: Promise<{ message: string }>
}) {
    const resolvedSearchParams = await searchParams;
    return (
        <div className="flex h-screen w-full items-center justify-center bg-neutral-950 relative overflow-hidden">
            {/* Ambient glows */}
            <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-emerald-600/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />

            <div className="w-full max-w-sm px-4 relative z-10">
                <div className="bg-neutral-900/80 backdrop-blur-xl border border-neutral-800 rounded-3xl p-8 shadow-2xl">
                    <div className="flex flex-col items-center mb-8">
                        <div className="h-20 w-auto mb-4 flex items-center justify-center">
                            <img src="/logo.png" alt="Kavach Group Logo" className="h-full w-auto object-contain" />
                        </div>
                        <p className="text-neutral-400 text-sm mt-2 text-center">
                            Enter your credentials to access the secure portal
                        </p>
                    </div>

                    <form action={login} className="space-y-5">
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-neutral-300 ml-1">Email Address</Label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                placeholder="admin@kavachsecurities.com"
                                required
                                className="bg-neutral-950 border-neutral-800 text-white placeholder:text-neutral-600 h-12 rounded-xl focus-visible:ring-emerald-500/50"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password" className="text-neutral-300 ml-1">Password</Label>
                            <Input
                                id="password"
                                name="password"
                                type="password"
                                placeholder="••••••••"
                                required
                                className="bg-neutral-950 border-neutral-800 text-white placeholder:text-neutral-600 h-12 rounded-xl focus-visible:ring-emerald-500/50"
                            />
                        </div>

                        {resolvedSearchParams?.message && (
                            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 flex items-center justify-center">
                                <p className="text-sm font-medium text-red-400 text-center">
                                    {resolvedSearchParams.message}
                                </p>
                            </div>
                        )}

                        <div className="pt-2">
                            <Button
                                className="w-full h-12 rounded-xl font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-900/50 transition-all"
                                type="submit"
                            >
                                <LockKeyhole className="w-4 h-4 mr-2" />
                                Secure Sign In
                            </Button>
                        </div>
                    </form>
                </div>

                <p className="text-center text-xs text-neutral-500 mt-8 relative z-10 font-medium tracking-widest">
                    SECURED BY KAVACH SYSTEMS
                </p>
            </div>
        </div>
    )
}
