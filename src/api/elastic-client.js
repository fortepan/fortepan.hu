import { appState } from "../js/app"

export const elasticRequest = async (data, index = "media") => {
  const r = await fetch(`/api/elastic/${appState("is-dev") ? "dev" : "prod"}/${index}/_search`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  if (!r.ok) throw new Error(r.status)
  return r.json()
}
