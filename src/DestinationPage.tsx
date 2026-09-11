import type { Destination } from './useDestinations'
import { useDestinationDetail, useNearbyStays } from './useDestinationDetail'

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]

function parseDay(value: string) {
  return new Date(`${value.slice(0, 10)}T00:00:00`)
}

function dayNumber(value: string) {
  const d = parseDay(value)
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`
}

function dayName(value: string) {
  return DAY_NAMES[parseDay(value).getDay()]
}

function seasonText(months: number[] | null | undefined) {
  if (!months || months.length === 0) return 'Year round'
  const sorted = [...months].sort((a, b) => a - b)
  return `${MONTHS[sorted[0] - 1]} – ${MONTHS[sorted[sorted.length - 1] - 1]}`
}

export default function DestinationPage({
  place,
  onClose,
  onOpenPlanner,
}: {
  place: Destination
  onClose: () => void
  onOpenPlanner: () => void
}) {
  const { week, alternatives, stays, loading, error } = useDestinationDetail(
    place.id,
  )
  const nearbyStays = useNearbyStays(alternatives)
  const shownStays = stays.length > 0 ? stays : nearbyStays

  const busyDays = week.filter((d) => d.band === 'High')
  const calmestDay = week.reduce<typeof week[number] | null>(
    (best, d) => (best === null || d.crowd_index < best.crowd_index ? d : best),
    null,
  )
  const eventDay = week.find((d) => d.signal_source === 'festival')

  return (
    <section className="destination-page">
      <button className="back-link" onClick={onClose}>
        ← Back to destinations
      </button>

      <header className="dp-hero">
        {place.photo_url ? (
          <img src={place.photo_url} alt={place.name} />
        ) : (
          <div className="dp-hero-fallback" aria-hidden="true" />
        )}
        <div className="dp-hero-text">
          <h1>{place.name}</h1>
          <p className="dp-hero-sub">{place.blurb}</p>
          <p className="dp-hero-meta">
            <span>{place.state}</span>
            <span>{place.type}</span>
            <span>Best season {seasonText((place as unknown as { peak_months?: number[] }).peak_months)}</span>
          </p>
        </div>
      </header>

      {error && (
        <div role="alert" className="planner-error">
          <p>{error}</p>
        </div>
      )}

      <div className="dp-grid">
        <div className="dp-main">
          <section className="dp-block">
            <h2>About {place.name}</h2>
            <p className="dp-body">{place.blurb}</p>

            <div className="dp-facts">
              <div>
                <small>BASELINE CROWD</small>
                <strong>{place.crowd_baseline}/100</strong>
                <span>how busy it normally is</span>
              </div>
              <div>
                <small>CAPACITY</small>
                <strong>{place.capacity_hint}/100</strong>
                <span>how much it can absorb</span>
              </div>
              <div>
                <small>REGION</small>
                <strong>{place.region}</strong>
                <span>{place.state}</span>
              </div>
            </div>
          </section>

          <section className="dp-block">
            <div className="dp-block-head">
              <div>
                <h2>7-day crowd forecast</h2>
                <p className="dp-body">Plan smarter. Avoid the peak days.</p>
              </div>
              <button className="text-button" onClick={onOpenPlanner}>
                Check another date →
              </button>
            </div>

            {loading && <p role="status">Loading forecast…</p>}

            {!loading && week.length > 0 && (
              <>
                <div className="dp-week">
                  {week.map((d) => (
                    <div
                      className={`dp-day ${d.band.toLowerCase()}`}
                      key={d.day}
                    >
                      <small>{dayNumber(d.day)}</small>
                      <span className="dp-day-name">{dayName(d.day)}</span>
                      <div
                        className="dp-bar"
                        style={{ height: `${Math.max(8, d.crowd_index)}%` }}
                      />
                      <strong>{d.band}</strong>
                      <span className="dp-day-figure">{d.crowd_index}</span>
                      {d.signal_source && (
                        <em className="dp-day-tag">
                          {d.signal_source === 'forecast' ? 'ASI' : 'event'}
                        </em>
                      )}
                    </div>
                  ))}
                </div>

                {busyDays.length > 0 && (
                  <div className="dp-alert">
                    <strong>
                      High pressure expected on{' '}
                      {busyDays.map((d) => dayNumber(d.day)).join(', ')}
                    </strong>
                    <span>
                      {eventDay
                        ? 'An event on these dates pushes footfall well above the seasonal norm. '
                        : ''}
                      {calmestDay
                        ? `${dayNumber(calmestDay.day)} is the calmest day this week at ${calmestDay.crowd_index}/100.`
                        : 'Consider a nearby alternative below.'}
                    </span>
                  </div>
                )}

                <p className="data-note">
                  Pressure weighs crowd against how much the place can absorb.
                  Days tagged ASI use measured footfall growth from Ministry of
                  Tourism data; the rest use the seasonal model.
                </p>
              </>
            )}
          </section>

          <section className="dp-block">
            <div className="dp-block-head">
              <div>
                <h2>Similar destinations nearby</h2>
                <p className="dp-body">
                  Equally beautiful. Less crowded. Same kind of trip.
                </p>
              </div>
            </div>

            {!loading && alternatives.length === 0 && (
              <p className="dp-body">
                Nothing within 250 km is meaningfully calmer on this date. Open
                the planner to widen the search.
              </p>
            )}

            <div className="dp-alt-grid">
              {alternatives.map((alt) => (
                <article className="dp-alt" key={alt.id}>
                  <div className="dp-alt-photo">
                    {alt.photo_url ? (
                      <img src={alt.photo_url} alt={alt.name} />
                    ) : (
                      <div className="card-photo-placeholder" aria-hidden="true" />
                    )}
                    <span className="dp-alt-distance">
                      {Math.round(alt.distance_km)} km
                    </span>
                  </div>
                  <div className="dp-alt-body">
                    <h3>{alt.name}</h3>
                    <span
                      className={
                        alt.pressure >= 70
                          ? 'band overloaded'
                          : alt.pressure >= 45
                            ? 'band busy'
                            : 'band comfortable'
                      }
                    >
                      {alt.pressure >= 70
                        ? 'High'
                        : alt.pressure >= 45
                          ? 'Moderate'
                          : 'Low'}{' '}
                      crowd
                    </span>
                    <p>{alt.blurb}</p>
                    <p className="dp-alt-relief">
                      {Math.round(alt.relief)} points calmer
                      {alt.stay_count > 0 && alt.min_price
                        ? ` · stays from ₹${alt.min_price}`
                        : ''}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </div>

        <aside className="dp-side">
          <div className="dp-side-card">
            <h3>Where it is</h3>
            <p className="dp-coords">
              {place.lat.toFixed(3)}° N, {place.lng.toFixed(3)}° E
            </p>
            <a
              className="dp-map-link"
              href={`https://www.google.com/maps/search/?api=1&query=${place.lat},${place.lng}`}
              target="_blank"
              rel="noreferrer"
            >
              View on map ↗
            </a>
            {alternatives.length > 0 && (
              <ul className="dp-distance-list">
                {alternatives.slice(0, 3).map((alt) => (
                  <li key={alt.id}>
                    <span>{alt.name}</span>
                    <strong>{Math.round(alt.distance_km)} km</strong>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="dp-side-card">
            <h3>
              {stays.length > 0
                ? `Stays in ${place.name}`
                : 'Stays in calmer places nearby'}
            </h3>
            {shownStays.length === 0 && (
              <p className="dp-body">
                No hosts have listed here yet. Add yours from the Stays tab.
              </p>
            )}
            <ul className="dp-stay-list">
              {shownStays.map((stay) => (
                <li key={stay.id}>
                  <div>
                    <strong>{stay.name}</strong>
                    <span>{stay.location}</span>
                  </div>
                  <span className="dp-price">
                    ₹{stay.price_per_night}
                    <small>/night</small>
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="dp-side-card accent">
            <h3>Travel responsibly</h3>
            <p>
              Sacred and fragile places are more beautiful when fewer of us
              arrive at once. A small detour spreads the benefit.
            </p>
          </div>
        </aside>
      </div>
    </section>
  )
}
