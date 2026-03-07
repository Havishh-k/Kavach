const fs = require('fs')

async function run() {
    try {
        const envStr = fs.readFileSync('.env.local', 'utf8')
        const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || envStr.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)?.[1]
        const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || envStr.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/)?.[1] || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || envStr.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)/)?.[1]

        console.log("URL:", SUPABASE_URL)

        const res = await fetch(`${SUPABASE_URL}/rest/v1/assignments?select=*&order=created_at.desc&limit=3`, {
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`
            }
        })
        const data = await res.json()
        console.log("DB RESULT:", JSON.stringify(data, null, 2))
    } catch (e) {
        console.error(e)
    }
}
run()
