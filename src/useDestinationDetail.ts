import { useEffect, useState } from 'react'
import { supabase } from './supabase'
import type { Alternative } from './useDestinations'

export type CrowdDay = {
  day: string
  crowd_index: number
  pressure: number
  band: 'High' | 'Moderate' | 'Low'
  signal_source: 'forecast' | 'festival' | null
}

export type Stay = {
  id: string
  name: string
  location: string
  price_per_night: number
  description: string | null
  photo_url: string | null
}

function message(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback
}

function today() {
  return new Date().toISOString().slice(0, 10)
}

export function useDestinationDetail(
  destinationId: number | null,
  startDate: string = today(),
) {
  const [week, setWeek] = useState<CrowdDay[]>([])
  const [alternatives, setAlternatives] = useState<Alternative[]>([])
  const [stays, setStays] = useState<Stay[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (destinationId === null) {
      setWeek([])
      setAlternatives([])
      setStays([])
      return
    }

    let active = true

    async function load() {
      setLoading(true)
      setError('')

      try {
        const [weekResult, altResult, stayResult] = await Promise.all([
          supabase.rpc('crowd_week', {
            p_destination_id: destinationId,
            p_start: startDate,
          }),
          supabase.rpc('get_alternatives', {
            p_destination_id: destinationId,
            p_date: startDate,
            p_radius_km: 250,
            p_limit: 4,
          }),
          supabase
            .from('yatriflow_stays')
            .select('id, name, location, price_per_night, description, photo_url')
            .eq('destination_id', destinationId)
            .eq('available', true)
            .order('price_per_night', { ascending: true }),
        ])

        if (weekResult.error) throw new Error(weekResult.error.message)
        if (altResult.error) throw new Error(altResult.error.message)
        if (stayResult.error) throw new Error(stayResult.error.message)
        if (!active) return

        setWeek((weekResult.data ?? []) as CrowdDay[])
        setAlternatives((altResult.data ?? []) as Alternative[])
        setStays((stayResult.data ?? []) as Stay[])
      } catch (caught) {
        if (!active) return
        setError(message(caught, 'Could not load this destination.'))
      } finally {
        if (active) setLoading(false)
      }
    }

    void load()
    return () => {
      active = false
    }
  }, [destinationId, startDate])

  return { week, alternatives, stays, loading, error }
}

export function useNearbyStays(alternatives: Alternative[]) {
  const [stays, setStays] = useState<Stay[]>([])

  useEffect(() => {
    const ids = alternatives.filter((a) => a.stay_count > 0).map((a) => a.id)
    if (ids.length === 0) {
      setStays([])
      return
    }

    let active = true

    async function load() {
      try {
        const { data, error } = await supabase
          .from('yatriflow_stays')
          .select('id, name, location, price_per_night, description, photo_url')
          .in('destination_id', ids)
          .eq('available', true)
          .order('price_per_night', { ascending: true })
          .limit(3)

                if (error) throw new Error(error.message)
        if (!active) return
        setStays((data ?? []) as Stay[])
      } catch {
        if (active) setStays([])
      }
    }

    void load()
    return () => {
      active = false
    }
  }, [alternatives])

  return stays
}