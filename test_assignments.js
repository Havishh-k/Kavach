const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

async function run() {
    try {
        const envStr = fs.readFileSync('.env.local', 'utf8');
        const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || envStr.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)?.[1]?.trim();
        const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || envStr.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/)?.[1]?.trim() || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || envStr.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)/)?.[1]?.trim();

        const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

        const today = new Date().toISOString();
        console.log("Today is:", today);

        const { data: assignments, error } = await supabase
            .from('assignments')
            .select('*');

        console.log("All assignments:", assignments);

        const { data: activeAssignments, error2 } = await supabase
            .from('assignments')
            .select('*')
            .lte('start_date', today)
            .gte('end_date', today);

        console.log("Active assignments logic:", activeAssignments);
        if (error2) console.error(error2);

    } catch (e) {
        console.error(e);
    }
}
run();
