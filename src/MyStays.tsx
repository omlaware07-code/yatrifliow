import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { supabase } from './supabase'

type Stay = {
  id: string
  owner_id: string
  name: string
  location: string
  price_per_night: number
  description: string
  photo_url: string
  available: boolean
}

export default function MyStays({ userId }: { userId: string }) {
  const [stays, setStays] = useState<Stay[]>([])
  const [name, setName] = useState('')
  const [location, setLocation] = useState('')
  const [price, setPrice] = useState('')
  const [description, setDescription] = useState('')
  const [photoUrl, setPhotoUrl] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function loadStays() {
    setLoading(true)
    setError('')

    const { data, error: loadError } = await supabase
      .from('yatriflow_stays')
      .select('id, owner_id, name, location, price_per_night, description, photo_url, available')
      .order('created_at', { ascending: false })

    if (loadError) {
      setError(loadError.message)
    } else {
      setStays((data ?? []) as Stay[])
    }

    setLoading(false)
  }

  useEffect(() => {
    void loadStays()
  }, [])

  async function addStay(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const amount = Number(price)

    if (!name.trim() || !location.trim() || !Number.isFinite(amount) || amount <= 0) {
      setError('Name, location ani valid price taka.')
      return
    }

    setSaving(true)
    setError('')

    const { data, error: saveError } = await supabase
      .from('yatriflow_stays')
      .insert({
        owner_id: userId,
        name: name.trim(),
        location: location.trim(),
        price_per_night: amount,
        description: description.trim(),
        photo_url: photoUrl.trim(),
        available: true,
      })
      .select('id, owner_id, name, location, price_per_night, description, photo_url, available')
      .single()

    if (saveError) {
      setError(saveError.message)
    } else {
      setStays((current) => [data as Stay, ...current])
      setName('')
      setLocation('')
      setPrice('')
      setDescription('')
      setPhotoUrl('')
    }

    setSaving(false)
  }

  async function toggleAvailability(stay: Stay) {
    setError('')

    const { data, error: updateError } = await supabase
      .from('yatriflow_stays')
      .update({ available: !stay.available })
      .eq('id', stay.id)
      .eq('owner_id', userId)
      .select('id, owner_id, name, location, price_per_night, description, photo_url, available')
      .single()

    if (updateError) {
      setError(updateError.message)
      return
    }

    setStays((current) =>
      current.map((item) => (item.id === stay.id ? (data as Stay) : item)),
    )
  }

  async function deleteStay(id: string) {
    const confirmed = window.confirm('Hi stay listing delete karaychi ka?')
    if (!confirmed) return

    setError('')

    const { error: deleteError } = await supabase
      .from('yatriflow_stays')
      .delete()
      .eq('id', id)
      .eq('owner_id', userId)

    if (deleteError) {
      setError(deleteError.message)
    } else {
      setStays((current) => current.filter((stay) => stay.id !== id))
    }
  }

  return (
    <section style={{ padding: '32px', width: '100%' }}>
      <div style={{ marginBottom: '24px' }}>
        <p className="eyebrow">HOST LISTINGS</p>
        <h2>Stays across India</h2>
        <p>Add your stay or explore available places.</p>
      </div>

      <form
        onSubmit={addStay}
        style={{
          display: 'grid',
          gap: '12px',
          padding: '20px',
          marginBottom: '28px',
          background: '#ffffff',
          border: '1px solid #e5e7eb',
          borderRadius: '18px',
        }}
      >
        <h3>Add a new stay</h3>

        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Stay name"
          required
        />

        <input
          value={location}
          onChange={(event) => setLocation(event.target.value)}
          placeholder="Location"
          required
        />

        <input
          value={price}
          onChange={(event) => setPrice(event.target.value)}
          placeholder="Price per night"
          type="number"
          min="1"
          required
        />

        <input
          value={photoUrl}
          onChange={(event) => setPhotoUrl(event.target.value)}
          placeholder="Photo URL (optional)"
          type="url"
        />

        <textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Description"
          rows={3}
        />

        <button className="primary" type="submit" disabled={saving}>
          {saving ? 'Adding...' : 'Add stay'}
        </button>
      </form>

      {error && (
        <p style={{ color: '#b91c1c', marginBottom: '16px' }}>
          {error}
        </p>
      )}

      {loading ? (
        <p>Loading stays...</p>
      ) : stays.length === 0 ? (
        <div className="empty">No stays available yet.</div>
      ) : (
        <div className="cards">
          {stays.map((stay) => (
            <article className="destination-card" key={stay.id}>
              {stay.photo_url ? (
                <img
                  className="card-photo"
                  src={stay.photo_url}
                  alt={stay.name}
                />
              ) : (
                <div
                  className="card-photo"
                  style={{
                    display: 'grid',
                    placeItems: 'center',
                    fontSize: '54px',
                    background: '#e8f5ed',
                  }}
                >
                  🏡
                </div>
              )}

              <div className="card-body">
                <p className="place-state">{stay.location}</p>
                <h3>{stay.name}</h3>
                <p className="card-note">
                  {stay.description || 'Comfortable stay for your journey.'}
                </p>
                <strong>₹{Number(stay.price_per_night).toLocaleString('en-IN')} / night</strong>

                <p>
                  <span className="badge">
                    {stay.available ? 'Available' : 'Unavailable'}
                  </span>
                </p>

                {stay.owner_id === userId && (
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <button
                      className="text-button"
                      type="button"
                      onClick={() => void toggleAvailability(stay)}
                    >
                      Mark {stay.available ? 'unavailable' : 'available'}
                    </button>

                    <button
                      className="text-button"
                      type="button"
                      onClick={() => void deleteStay(stay.id)}
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}
