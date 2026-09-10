import { useState } from 'react'
import type { FormEvent } from 'react'
import './index.css'
import MyTrips from './MyTrips'
import MyStays from './MyStays'
import { useSavedPlaces } from './useSavedPlaces'
import { useDestinations } from './useDestinations'

const CATEGORIES = [
  'All',
  'Pilgrimage',
  'Mountains',
  'Nature',
  'Heritage',
  'Beach',
  'Wildlife',
]

function crowdLabel(baseline: number) {
  if (baseline < 40) return 'Low'
  if (baseline < 70) return 'Moderate'
  return 'High'
}

export default function App({ userId }: { userId: string }) {
  const [page, setPage] = useState('Home')
  const [input, setInput] = useState('')
  const [query, setQuery] = useState('')
  const [lowOnly, setLowOnly] = useState(false)
  const [selected, setSelected] = useState<number | null>(null)
  const [category, setCategory] = useState('All')

  const {
    destinations,
    loading: placesLoading,
    error: placesError,
  } = useDestinations()

  const { saved, toggleSave, savedLoading, saving, savedError } =
    useSavedPlaces(userId)

  const visible = destinations.filter(
    (place) =>
      `${place.name} ${place.state}`
        .toLowerCase()
        .includes(query.toLowerCase()) &&
      (!lowOnly || place.crowd_baseline < 40) &&
      (category === 'All' || place.type === category) &&
      (page !== 'Saved' || saved.includes(place.id)),
  )

  const detail = destinations.find((place) => place.id === selected)

  function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setQuery(input.trim())
    setSelected(null)
    setPage('Explore')
  }

  function navigate(next: string) {
    setPage(next)
    setInput('')
    setQuery('')
    setLowOnly(false)
    setCategory('All')
    setSelected(null)
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a
          className="brand"
          href="#"
          onClick={(event) => {
            event.preventDefault()
            navigate('Home')
          }}
        >
          <span className="brand-mark" aria-hidden="true">
            ↗
          </span>
          <span>
            YatriFlow<small>Travel better. Spread the joy.</small>
          </span>
        </a>

        <nav aria-label="Main navigation">
          {['Home', 'Explore', 'Saved', 'Trips', 'Stays'].map((item) => (
            <button
              key={item}
              className={page === item ? 'nav-item active' : 'nav-item'}
              aria-current={page === item ? 'page' : undefined}
              onClick={() => navigate(item)}
            >
              <span aria-hidden="true">
                {item === 'Home'
                  ? '⌂'
                  : item === 'Explore'
                    ? '◎'
                    : item === 'Saved'
                      ? '♡'
                      : item === 'Trips'
                        ? '✈'
                        : '🏡'}
              </span>
              {item}
              {item === 'Saved' && <small>{saved.length}</small>}
            </button>
          ))}
        </nav>

        <div className="sidebar-note">
          <span aria-hidden="true">↗</span>
          <strong>
            Small detours.
            <br />
            Bigger discoveries.
          </strong>
          <p>Responsible travel starts with thoughtful choices.</p>
        </div>

        <small className="prototype">SIH PROJECT · STEP 02</small>
      </aside>

      <main>
        {savedLoading && <p role="status">Loading your saved places…</p>}
        {saving && <p role="status">Updating your saved places…</p>}

        {savedError && (
          <div role="alert">
            <p>Saved places error: {savedError}</p>
            <button type="button" onClick={() => window.location.reload()}>
              Reload and try again
            </button>
          </div>
        )}

        <header className="topbar">
          <span>
            {page} <span className="muted">/ Discover India</span>
          </span>
          <span className="demo-tag">DEMO PROTOTYPE</span>
        </header>

        <section className="hero">
          <div className="hero-copy">
            <p className="eyebrow">EXPLORE A BALANCED INDIA</p>
            <h1>
              Travel beyond
              <br />
              the crowds.
            </h1>
            <p>
              Smarter travel. Happier places.
              <br />
              Stronger communities.
            </p>
            <a href="#destinations">
              Find your next escape <span aria-hidden="true">↗</span>
            </a>
          </div>
          <div
            className="hero-photo"
            role="img"
            aria-label="Illustrative mountain landscape"
          />
        </section>

        <form className="search-box" onSubmit={search}>
          <div>
            <label htmlFor="destination">Where would you like to go?</label>
            <input
              id="destination"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Try Kedarnath or Uttarakhand"
            />
          </div>
          <button className="primary" type="submit">
            Search destinations →
          </button>
        </form>

        {page === 'Trips' ? (
          <MyTrips userId={userId} />
        ) : page === 'Stays' ? (
          <MyStays userId={userId} />
        ) : (
          <>
            <section id="destinations" className="destinations">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">A LITTLE INSPIRATION</p>
                  <h2>
                    {page === 'Saved'
                      ? 'Your saved places'
                      : query
                        ? `Results for “${query}”`
                        : 'Find your kind of India'}
                  </h2>
                </div>
                <label className="crowd-filter">
                  <input
                    type="checkbox"
                    checked={lowOnly}
                    onChange={(event) => {
                      setLowOnly(event.target.checked)
                      setSelected(null)
                    }}
                  />
                  Less crowded
                </label>
              </div>

              <div className="categories" aria-label="Destination categories">
                {CATEGORIES.map((item) => (
                  <button
                    key={item}
                    aria-pressed={category === item}
                    className={category === item ? 'chip chosen' : 'chip'}
                    onClick={() => {
                      setCategory(item)
                      setSelected(null)
                    }}
                  >
                    {item}
                  </button>
                ))}
              </div>

              <p className="data-note">
                Crowd levels are modelled estimates, not live forecasts.
              </p>

              {placesLoading && (
                <p role="status">Loading destinations…</p>
              )}

              {placesError && (
                <div role="alert">
                  <p>Could not load destinations: {placesError}</p>
                  <button
                    type="button"
                    onClick={() => window.location.reload()}
                  >
                    Reload and try again
                  </button>
                </div>
              )}

              <div className="cards">
                {visible.map((place) => (
                  <article className="destination-card" key={place.id}>
                    <div className="card-photo">
                      {place.photo_url ? (
                        <img
                          src={place.photo_url}
                          alt={`Scenery near ${place.name}`}
                        />
                      ) : (
                        <div
                          className="card-photo-placeholder"
                          aria-hidden="true"
                        />
                      )}
                      <button
                        className="save-button"
                        aria-label={`${
                          saved.includes(place.id) ? 'Unsave' : 'Save'
                        } ${place.name}`}
                        aria-pressed={saved.includes(place.id)}
                        disabled={savedLoading || saving || Boolean(savedError)}
                        onClick={() => void toggleSave(place.id)}
                      >
                        {saved.includes(place.id) ? '♥' : '♡'}
                      </button>
                    </div>

                    <div className="card-body">
                      <p className="place-state">{place.state}</p>
                      <h3>{place.name}</h3>
                      <span
                        className={`badge ${crowdLabel(
                          place.crowd_baseline,
                        ).toLowerCase()}`}
                      >
                        {crowdLabel(place.crowd_baseline)} crowd
                      </span>
                      <p className="card-note">{place.blurb}</p>
                      <button
                        className="text-button"
                        aria-expanded={selected === place.id}
                        aria-controls="place-details"
                        onClick={() =>
                          setSelected(selected === place.id ? null : place.id)
                        }
                      >
                        View overview →
                      </button>
                    </div>
                  </article>
                ))}
              </div>

              {!placesLoading && !placesError && visible.length === 0 && (
                <div className="empty" role="status">
                  <h3>No places found</h3>
                  <p>
                    {page === 'Saved'
                      ? 'Save a place with the heart button on Home, or clear your filters.'
                      : 'Try another destination or category, or turn off the crowd filter.'}
                  </p>
                  <button className="primary" onClick={() => navigate('Home')}>
                    Reset and show all places
                  </button>
                </div>
              )}

              <div id="place-details" aria-live="polite">
                {detail && (
                  <section className="detail-panel">
                    <div>
                      <p className="eyebrow">DESTINATION PREVIEW</p>
                      <h2>{detail.name}</h2>
                      <p>
                        {detail.state} · {detail.type}
                      </p>
                      <p>{detail.blurb}</p>
                      <p className="data-note">
                        Dates, forecasts and bookings are not connected yet.
                      </p>
                    </div>
                    <button
                      className="close-button"
                      onClick={() => setSelected(null)}
                    >
                      Close
                    </button>
                  </section>
                )}
              </div>
            </section>

            <section className="impact">
              <div>
                <p className="eyebrow">TRAVEL BETTER. SPREAD THE JOY.</p>
                <h2>A good trip can do more.</h2>
                <p>
                  Explore thoughtfully. Respect local places.
                  <br />
                  Make space for stronger communities.
                </p>
              </div>
              <span aria-hidden="true">↗</span>
            </section>
          </>
        )}

        <footer>
          YatriFlow · Team Rajmudra{' '}
          <span>Saved places are linked to your account.</span>
        </footer>
      </main>
    </div>
  )
}