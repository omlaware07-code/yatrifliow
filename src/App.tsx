import { useState } from 'react'
import type { FormEvent } from 'react'
import './index.css'
import MyTrips from './MyTrips'
import MyStays from './MyStays'
import Redirect from './Redirect'
import DestinationPage from './DestinationPage'
import { useSavedPlaces } from './useSavedPlaces'
import { useDestinations } from './useDestinations'

const NAV_ITEMS = ['Home', 'Explore', 'Plan', 'Saved', 'Trips', 'Stays']

const NAV_ICONS: Record<string, string> = {
  Home: '⌂',
  Explore: '◎',
  Plan: '◈',
  Saved: '♡',
  Trips: '✈',
  Stays: '❖',
}

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
  const [category, setCategory] = useState('All')
  const [openPlace, setOpenPlace] = useState<number | null>(null)

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

  const detail = destinations.find((place) => place.id === openPlace)

  function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setQuery(input.trim())
    setOpenPlace(null)
    setPage('Explore')
  }

  function navigate(next: string) {
    setPage(next)
    setInput('')
    setQuery('')
    setLowOnly(false)
    setCategory('All')
    setOpenPlace(null)
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
          {NAV_ITEMS.map((item) => (
            <button
              key={item}
              className={page === item ? 'nav-item active' : 'nav-item'}
              aria-current={page === item ? 'page' : undefined}
              onClick={() => navigate(item)}
            >
              <span aria-hidden="true">{NAV_ICONS[item]}</span>
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

        <small className="prototype">SIH PROJECT · TEAM RAJMUDRA</small>
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
            {detail ? detail.name : page}{' '}
            <span className="muted">/ Discover India</span>
          </span>
          <span className="demo-tag">DEMO PROTOTYPE</span>
        </header>

        {page !== 'Plan' && !detail && (
          <>
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
          </>
        )}

        {detail ? (
          <DestinationPage
            place={detail}
            onClose={() => setOpenPlace(null)}
            onOpenPlanner={() => {
              setOpenPlace(null)
              navigate('Plan')
            }}
          />
        ) : page === 'Plan' ? (
          <Redirect />
        ) : page === 'Trips' ? (
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
                    onChange={(event) => setLowOnly(event.target.checked)}
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
                    onClick={() => setCategory(item)}
                  >
                    {item}
                  </button>
                ))}
              </div>

              <p className="data-note">
                Crowd levels are modelled estimates, calibrated against ASI
                footfall data where it exists.
              </p>

              {placesLoading && <p role="status">Loading destinations…</p>}

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
                        onClick={() => setOpenPlace(place.id)}
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