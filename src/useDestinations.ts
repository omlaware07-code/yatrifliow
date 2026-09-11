import { useCallback, useEffect, useState } from 'react'
import { supabase } from './supabase'

export type Destination = {
  id: number
  name: string
  state: string
  region: string
  type: string
  lat: number
  lng: number
  crowd_baseline: number
  capacity_hint: number
  photo_url: string | null
  blurb: string | null
}

export type CrowdStatus = {
  id: number
  name: string
  state: string
  type: string
  crowd_index: number
  pressure: number
  band: 'Overloaded' | 'Busy' | 'Comfortable'
  signal_source: 'forecast' | 'festival' | 'model' | null
  signal_note: string | null
}

export type Alternative = {
  id: number
  name: string
  state: string
  type: string
  lat: number
  lng: number
  blurb: string | null
  photo_url: string | null
  distance_km: number
  crowd_index: number
  pressure: number
  relief: number
  stay_count: number
  min_price: number | null
  match_score: number
}

const DESTINATION_COLUMNS =
  'id, name, state, region, type, lat, lng, crowd_baseline, capacity_hint, photo_url, blurb'

function message(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback
}

export function useDestinations() {
  const [destinations, setDestinations] = useState<Destination[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    async function load() {
      setLoading(true)
      setError('')

      try {
        const { data, error } = await supabase
          .from('destinations')
          .select(DESTINATION_COLUMNS)
          .order('name', { ascending: true })

        if (error) throw new Error(error.message)
        if (!active) return

        setDestinations((data ?? []) as Destination[])
      } catch (caught) {
        if (!active) return
        setError(message(caught, 'Could not load destinations.'))
      } finally {
        if (active) setLoading(false)
      }
    }

    void load()
    return () => {
      active = false
    }
  }, [])

  return { destinations, loading, error }
}

export function useRedirect() {
  const [status, setStatus] = useState<CrowdStatus | null>(null)
  const [alternatives, setAlternatives] = useState<Alternative[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const check = useCallback(
    async (destinationId: number, date: string, radiusKm = 250) => {
      setLoading(true)
      setError('')
      setStatus(null)
      setAlternatives([])

      try {
        const [statusResult, alternativesResult] = await Promise.all([
          supabase.rpc('destination_status', {
            p_destination_id: destinationId,
            p_date: date,
          }),
          supabase.rpc('get_alternatives', {
            p_destination_id: destinationId,
            p_date: date,
            p_radius_km: radiusKm,
            p_limit: 3,
          }),
        ])

        if (statusResult.error) throw new Error(statusResult.error.message)
        if (alternativesResult.error) {
          throw new Error(alternativesResult.error.message)
        }

        setStatus((statusResult.data?.[0] ?? null) as CrowdStatus | null)
        setAlternatives((alternativesResult.data ?? []) as Alternative[])
      } catch (caught) {
        setError(message(caught, 'Could not check crowd levels.'))
      } finally {
        setLoading(false)
      }
    },
    [],
  )

  const reset = useCallback(() => {
    setStatus(null)
    setAlternatives([])
    setError('')
  }, [])

  return { status, alternatives, loading, error, check, reset }
}