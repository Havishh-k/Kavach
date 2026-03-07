'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'

export function DashboardChart({ data }: { data: any[] }) {
    if (!data || data.length === 0) {
        return (
            <Card className="mt-6 border border-border bg-white/50 dark:bg-neutral-900/50 backdrop-blur-sm shadow-sm">
                <CardHeader>
                    <CardTitle>Attendance Trends</CardTitle>
                </CardHeader>
                <CardContent className="h-[300px] flex items-center justify-center text-muted-foreground">
                    No data available for the last 7 days.
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="mt-6 border border-border bg-white/70 dark:bg-neutral-900/70 backdrop-blur-lg shadow-md transition-all duration-300">
            <CardHeader className="pb-2">
                <CardTitle className="bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
                    Attendance Trends (Last 7 Days)
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="h-[300px] w-full pt-4">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.1)" className="dark:stroke-neutral-800 stroke-neutral-200" />
                            <XAxis
                                dataKey="date"
                                stroke="#888888"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                dy={10}
                            />
                            <YAxis
                                stroke="#888888"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(value) => `${value}`}
                            />
                            <Tooltip
                                contentStyle={{
                                    borderRadius: '12px',
                                    backgroundColor: 'var(--tooltip-bg, rgba(255, 255, 255, 0.8))',
                                    backdropFilter: 'blur(12px)',
                                    WebkitBackdropFilter: 'blur(12px)',
                                    border: '1px solid rgba(0,0,0,0.05)',
                                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
                                    color: '#333'
                                }}
                                cursor={{ stroke: '#10b981', strokeWidth: 1, strokeDasharray: '4 4' }}
                            />
                            <Area
                                type="monotone"
                                dataKey="count"
                                stroke="#10b981"
                                strokeWidth={3}
                                fillOpacity={1}
                                fill="url(#colorCount)"
                                name="Checked In"
                                activeDot={{ r: 6, fill: "#fff", stroke: "#10b981", strokeWidth: 2 }}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    )
}
