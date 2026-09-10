import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { supabase } from './supabase'

type Trip = {
  id: string
  title: string
  destination: string
  start_date: string
  end_date: string
  notes: string
}

export default function MyTrips({ userId }: { userId: string }) {
  const [trips, setTrips] = useState<Trip[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    async function loadTrips() {
      setLoading(true)
      setError('')

      try {
        const { data, error } = await supabase
          .from('yatriflow_trips')
          .select('id, title, destination, start_date, end_date, notes')
          .eq('user_id', userId)
          .order('start_date', { ascending: true })

        if (error) throw new Error(error.message)
        if (!active) return

        setTrips(data ?? [])
      } catch (error) {
        if (!active) return
        setError(
          error instanceof Error ? error.message : 'Could not load trips.',
        )
      } finally {
        if (active) setLoading(false)
      }
    }

    void loadTrips()

    return () => {
      active = false
    }
  }, [userId])

  async function addTrip(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (saving) return

    const form = event.currentTarget
    const fields = new FormData(form)
    const title = String(fields.get('title') ?? '').trim()
    const destination = String(fields.get('destination') ?? '').trim()
    const startDate = String(fields.get('startDate') ?? '')
    const endDate = String(fields.get('endDate') ?? '')
    const notes = String(fields.get('notes') ?? '').trim()

    setError('')

    if (!title || !destination || !startDate || !endDate) {
      setError('Please fill in title, destination, and both dates.')
      return
    }

    if (endDate < startDate) {
      setError('End date cannot be before start date.')
      return
    }

    setSaving(true)

    try {
      const { data, error } = await supabase
        .from('yatriflow_trips')
        .insert({
          user_id: userId,
          title,
          destination,
          start_date: startDate,
          end_date: endDate,
          notes,
        })
        .select('id, title, destination, start_date, end_date, notes')
        .single()

      if (error) throw new Error(error.message)

      setTrips((current) =>
        [...current, data].sort((a, b) =>
          a.start_date.localeCompare(b.start_date),
        ),
      )

      form.reset()
    } catch (error) {
      setError(
        error instanceof Error ? error.message : 'Could not save this trip.',
      )
    } finally {
      setSaving(false)
    }
  }

  async function deleteTrip(id: string) {
    setError('')

    try {
      const { error } = await supabase
        .from('yatriflow_trips')
        .delete()
        .eq('id', id)
        .eq('user_id', userId)

      if (error) throw new Error(error.message)

      setTrips((current) => current.filter((trip) => trip.id !== id))
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : 'Could not delete this trip.',
      )
    }
  }

  return (
    <main style={{ padding: '24px', maxWidth: '720px' }}>
      <h1>My Trips</h1>
      <p>Plan your next journey. Only you can see these trips.</p>

      <form
        onSubmit={addTrip}
        aria-busy={saving}
        style={{
          display: 'grid',
          gap: '10px',
          margin: '20px 0',
          maxWidth: '420px',
        }}
      >
        <label htmlFor="trip-title">Trip title</label>
        <input id="trip-title" name="title" required disabled={saving} />

        <label htmlFor="trip-destination">Destination</label>
        <input
          id="trip-destination"
          name="destination"
          required
          disabled={saving}
        />

        <label htmlFor="trip-start">Start date</label>
        <input
          id="trip-start"
          name="startDate"
          type="date"
          required
          disabled={saving}
        />

        <label htmlFor="trip-end">End date</label>
        <input
          id="trip-end"
          name="endDate"
          type="date"
          required
          disabled={saving}
        />

        <label htmlFor="trip-notes">Notes (optional)</label>
        <textarea id="trip-notes" name="notes" disabled={saving} />

        <button type="submit" disabled={saving}>
          {saving ? 'Saving…' : 'Add trip'}
        </button>

        {error && <p role="alert">{error}</p>}
      </form>

      {loading ? (
        <p role="status">Loading your trips…</p>
      ) : trips.length === 0 ? (
        <p>You have no saved trips yet.</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, display: 'grid', gap: '12px' }}>
          {trips.map((trip) => (
            <li
              key={trip.id}
              style={{
                border: '1px solid #ccc',
                borderRadius: '8px',
                padding: '12px',
              }}
            >
              <strong>{trip.title}</strong> — {trip.destination}
              <div>
                {trip.start_date} to {trip.end_date}
              </div>
              {trip.notes && <p>{trip.notes}</p>}
              <button type="button" onClick={() => void deleteTrip(trip.id)}>
                Delete trip
              </button>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}