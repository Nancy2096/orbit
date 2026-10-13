import { redirect } from "next/navigation"

// Projects are stored as accounts with account_type = "project"; the old form
// wrote to the legacy `projects` table, which the Projects list never reads.
export default function NewProjectPage() {
  redirect("/dashboard/accounts/new?from=projects")
}
