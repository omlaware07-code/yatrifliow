import { useEffect, useState } from 'react'
import { supabase } from './supabase'

type Stats = {
  destinations: number
  underPressure: number
  bookableStays: number
}

export default function ImpactStats() {
  const [stats, setStats] = useState<Stats | null>(null)

  useEffect(() => {
    let active = true

    async function load() {
      try {
        const [total, pressured, stays] = await Promise.all([
          supabase
            .from('destinations')
            .select('id', { count: 'exact', head: true }),
          supabase
            .from('destinations')
            .select('id', { count: 'exact', head: true })
            .gte('crowd_baseline', 70),
          supabase
            .from('yatriflow_stays')
            .select('id', { count: 'exact', head: true })
            .eq('available', true),
        ])

        if (!active) return

        setStats({
          destinations: total.count ?? 0,
          underPressure: pressured.count ?? 0,
          bookableStays: stays.count ?? 0,
        })
      } catch {
        // stats are decoration — a failure here should not break the page
      }
    }

    void load()
    return () => {
      active = false
    }
  }, [])

  if (!stats) return null

  return (
    <div className="impact-stats">
      <div>
        <strong>{stats.destinations}</strong>
        <span>destinations tracked</span>
      </div>
      <div>
        <strong>{stats.underPressure}</strong>
        <span>under pressure in season</span>
      </div>
      <div>
        <strong>{stats.bookableStays}</strong>
        <span>bookable stays in calmer places</span>
      </div>
    </div>
  )
}
