import { createClient } from "@supabase/supabase-js"

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabase = createClient(url, key)

const accountTeamRes = await supabase
  .from("account_team_members")
  .select(`
    id,
    manager_id,
    coordinator_id,
    department_id,
    accounts!inner ( id, name, agency_id, status )
  `)
  .eq("accounts.status", "active")

console.log("[test] accountTeamRes.error:", accountTeamRes.error)
console.log("[test] accountTeamRes count:", accountTeamRes.data?.length)
console.log("[test] accountTeamRes sample:", JSON.stringify(accountTeamRes.data?.[0], null, 2))

const projectTeamRes = await supabase
  .from("project_team_members")
  .select(`
    id,
    manager_id,
    coordinator_id,
    projects!inner (
      id,
      name,
      account_id,
      status,
      accounts!inner ( agency_id )
    )
  `)
  .in("projects.status", ["active", "in_progress"])

console.log("[test] projectTeamRes.error:", projectTeamRes.error)
console.log("[test] projectTeamRes count:", projectTeamRes.data?.length)
console.log("[test] projectTeamRes sample:", JSON.stringify(projectTeamRes.data?.[0], null, 2))
