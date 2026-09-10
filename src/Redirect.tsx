import { useState } from 'react'
import type { FormEvent } from 'react'
import { useDestinations, useRedirect } from './useDestinations'
import ImpactStats from './ImpactStats'

function defaultDate() {
  const date = new Date()
  date.setDate(date.getDate() + 30)
  return date.toISOString().slice(0, 10)
}

function prettyDate(value: string) {
  const parsed = new Date(`${value}T00:00:00`)
  if (Number.isNaN(parsed.getTime())) return value
  return parsed.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function bandClass(band: string) {
  if (band === 'Overloaded') return 'band overloaded'
  if (band === 'Busy') return 'band busy'
  return 'band comfortable'
}

function reason(
  type: string,
  originType: string | undefined,
  distance: number,
  relief: number,
) {
  const bits: string[] = []
  if (originType && type === originType) {
    bits.push(`same ${type.toLowerCase()} experience`)
  }
  bits.push(`${Math.round(distance)} km away`)
  bits.push(`${Math.round(relief)} points calmer`)
  return bits.join(' · ')
}

export default function Redirect() {
  const { destinations, loading: listLoading } = useDestinations()
  const { status, alternatives, loading, error, check } = useRedirect()

  const [destinationId, setDestinationId] = useState<number | ''>('')
  const [date, setDate] = useState(defaultDate())
  const [radius, setRadius] = useState(250)
  const [checked, setChecked] = useState(false)

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (destinationId === '') return
    setChecked(true)
    void check(Number(destinationId), date, radius)
  }

  function widenSearch() {
    if (destinationId === '') return
    setRadius(400)
    void check(Number(destinationId), date, 400)
  }

  return (
    <section className="planner">
      <div className="section-heading">
        <div>
          <p className="eyebrow">CROWD-AWARE PLANNING</p>
          <h2>Check before you go</h2>
        </div>
      </div>
<ImpactStats />
      <form className="planner-form" onSubmit={submit}>
        <div>
          <label htmlFor="plan-destination">Where are you planning to go?</label>
          <select
            id="plan-destination"
            value={destinationId}
            onChange={(event) =>
              setDestinationId(
                event.target.value === '' ? '' : Number(event.target.value),
              )
            }
            disabled={listLoading}
          >
            <option value="">
              {listLoading ? 'Loading destinations…' : 'Select a destination'}
            </option>
            {destinations.map((place) => (
              <option key={place.id} value={place.id}>
                {place.name} — {place.state}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="plan-date">Travel date</label>
          <input
            id="plan-date"
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
          />
        </div>

        <div>
          <label htmlFor="plan-radius">Willing to travel</label>
          <select
            id="plan-radius"
            value={radius}
            onChange={(event) => setRadius(Number(event.target.value))}
          >
            <option value={150}>Within 150 km</option>
            <option value={250}>Within 250 km</option>
            <option value={400}>Within 400 km</option>
          </select>
        </div>

        <button
          className="primary"
          type="submit"
          disabled={destinationId === '' || loading}
        >
          {loading ? 'Checking…' : 'Check crowd levels →'}
        </button>
      </form>

      {error && (
        <div role="alert" className="planner-error">
          <p>Could not check crowd levels: {error}</p>
        </div>
      )}

      {status && (
        <div className="status-card">
          <div>
            <p className="eyebrow">ON {prettyDate(date)}</p>
            <h3>
              {status.name}, {status.state}
            </h3>
            <p className="status-line">
              <span className={bandClass(status.band)}>{status.band}</span>
              <span className="muted">
                crowd {status.crowd_index}/100 · pressure {status.pressure}/100
              </span>
            </p>
            <p className="data-note">
              Pressure weighs crowd against how much the place can absorb, so a
              small fragile site scores higher than a large town at the same
              crowd level.
            </p>
          </div>
        </div>
      )}

      {checked && !loading && status && alternatives.length > 0 && (
        <div className="alternatives">
          <p className="eyebrow">CALMER NEARBY, SAME KIND OF TRIP</p>
          {alternatives.map((place) => (
            <article className="alternative-card" key={place.id}>
              <div className="alternative-main">
                <h4>
                  {place.name} <span className="muted">· {place.state}</span>
                </h4>
                <p className="card-note">{place.blurb}</p>
                <p className="reason">
                  {reason(
                    place.type,
                    status.type,
                    place.distance_km,
                    place.relief,
                  )}
                </p>
              </div>
              <div className="alternative-side">
                <span className="pressure-figure">{place.pressure}</span>
                <small>pressure</small>
                {place.stay_count > 0 ? (
                  <p className="bookable">
                    {place.stay_count} stay{place.stay_count > 1 ? 's' : ''}
                    {place.min_price ? ` from ₹${place.min_price}` : ''}
                  </p>
                ) : (
                  <p className="muted small">No stays listed yet</p>
                )}
              </div>
            </article>
          ))}
        </div>
      )}

      {checked && !loading && status && alternatives.length === 0 && !error && (
        <div className="empty" role="status">
          <h3>No calmer alternative within {radius} km</h3>
          <p>
            Everything nearby is under similar pressure on this date. Widen the
            search, or try a different week.
          </p>
          {radius < 400 && (
            <button className="primary" onClick={widenSearch}>
              Search within 400 km
            </button>
          )}
        </div>
      )}
    </section>
  )
}