import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import ExcelJS from 'exceljs'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
    try {
        const supabase = await createClient()

        // 1. Fetch raw attendance logs
        const { data: attendanceData, error: attendanceError } = await supabase
            .from('attendance')
            .select(`
                id,
                check_in_time,
                check_out_time,
                status,
                regular_hours,
                ot_hours,
                guards:guard_id(full_name),
                sites:site_id(name)
            `)
            .order('check_in_time', { ascending: false })

        if (attendanceError) throw attendanceError

        // 2. Fetch payroll summary data 
        // (Re-using the logic from the page loosely, but server-side)
        const summaryMap: Record<string, any> = {}
        const { data: allAttendance } = await supabase
            .from('attendance')
            .select(`
                guard_id,
                regular_hours,
                ot_hours,
                guards:guard_id ( full_name, payroll_config ( base_hourly_rate, ot_multiplier ) )
            `)

        if (allAttendance) {
            for (const record of allAttendance) {
                if (!record.guards) continue

                const gId = record.guard_id
                const guardsObj = Array.isArray(record.guards) ? record.guards[0] as any : record.guards as any

                if (!summaryMap[gId]) {
                    const config = Array.isArray(guardsObj.payroll_config)
                        ? guardsObj.payroll_config[0]
                        : guardsObj.payroll_config

                    summaryMap[gId] = {
                        full_name: guardsObj.full_name,
                        total_regular_hours: 0,
                        total_ot_hours: 0,
                        base_rate: config?.base_hourly_rate || 0,
                        ot_multiplier: config?.ot_multiplier || 1.5,
                        shifts_worked: 0
                    }
                }

                summaryMap[gId].total_regular_hours += Number(record.regular_hours || 0)
                summaryMap[gId].total_ot_hours += Number(record.ot_hours || 0)
                summaryMap[gId].shifts_worked += 1
            }
        }

        // Initialize Excel Workbook
        const workbook = new ExcelJS.Workbook()
        workbook.creator = 'Kavach Securities System'
        workbook.created = new Date()

        // SHEET 1: Attendance Log
        const logSheet = workbook.addWorksheet('Attendance Logs')
        logSheet.columns = [
            { header: 'Date', key: 'date', width: 15 },
            { header: 'Guard Name', key: 'guard', width: 25 },
            { header: 'Site', key: 'site', width: 25 },
            { header: 'Check In', key: 'checkIn', width: 15 },
            { header: 'Check Out', key: 'checkOut', width: 15 },
            { header: 'Regular Hrs', key: 'regHrs', width: 12 },
            { header: 'OT Hrs', key: 'otHrs', width: 10 },
            { header: 'Status', key: 'status', width: 15 },
        ]

        // Add styling to headers
        logSheet.getRow(1).font = { bold: true }
        logSheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E0E0' } }

        attendanceData.forEach(row => {
            const checkInD = new Date(row.check_in_time)
            const checkOutD = row.check_out_time ? new Date(row.check_out_time) : null

            const guards = Array.isArray(row.guards) ? row.guards[0] : row.guards
            const sites = Array.isArray(row.sites) ? row.sites[0] : row.sites

            logSheet.addRow({
                date: checkInD.toLocaleDateString(),
                guard: guards?.full_name || 'Unknown',
                site: sites?.name || 'Unknown',
                checkIn: checkInD.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                checkOut: checkOutD ? checkOutD.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Active',
                regHrs: row.regular_hours || 0,
                otHrs: row.ot_hours || 0,
                status: row.status
            })
        })

        // SHEET 2: Payroll Summary
        const summarySheet = workbook.addWorksheet('Payroll Summary')
        summarySheet.columns = [
            { header: 'Guard Name', key: 'guard', width: 25 },
            { header: 'Shifts Worked', key: 'shifts', width: 15 },
            { header: 'Regular Hrs', key: 'regHrs', width: 15 },
            { header: 'OT Hrs', key: 'otHrs', width: 15 },
            { header: 'Base Rate (₹)', key: 'base', width: 15 },
            { header: 'Gross Regular', key: 'grossReg', width: 15 },
            { header: 'Gross OT', key: 'grossOt', width: 15 },
            { header: 'Total Gross Pay (₹)', key: 'total', width: 20 },
        ]

        summarySheet.getRow(1).font = { bold: true }
        summarySheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8F5E9' } }

        Object.values(summaryMap).forEach(s => {
            const grossReg = s.total_regular_hours * s.base_rate
            const grossOt = s.total_ot_hours * (s.base_rate * s.ot_multiplier)
            const total = grossReg + grossOt

            const row = summarySheet.addRow({
                guard: s.full_name,
                shifts: s.shifts_worked,
                regHrs: s.total_regular_hours.toFixed(2),
                otHrs: s.total_ot_hours.toFixed(2),
                base: s.base_rate,
                grossReg: grossReg.toFixed(2),
                grossOt: grossOt.toFixed(2),
                total: total.toFixed(2)
            })

            // Highlight Total Gross Pay column
            const totalCell = row.getCell('total')
            totalCell.font = { bold: true, color: { argb: 'FF006600' } }
        })

        // Generate Buffer
        const buffer = await workbook.xlsx.writeBuffer()

        // Return as downloadable file
        return new NextResponse(buffer, {
            status: 200,
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'Content-Disposition': `attachment; filename="Kavach_Payroll_Report_${new Date().toISOString().split('T')[0]}.xlsx"`
            }
        })

    } catch (error: any) {
        console.error("Export Error:", error)
        return new NextResponse("Failed to generate export.", { status: 500 })
    }
}
