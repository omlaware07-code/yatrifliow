# YatriFlow

**Travel better. Spread the joy.**

Smart India Hackathon 2026 · Team Rajmudra · PS SIH26204 (Travel & Tourism)

---

## The problem

India's tourism problem is not too few visitors. It is that almost all of them go to the same handful of places, in the same few weeks.

Kedarnath, Manali, Jaipur and Ooty run past capacity every season — queues, strained infrastructure, damage to fragile sites, and local prices pushed out of reach. Meanwhile Bundi, Tirthan, Ziro and Valparai sit an easy drive away, with homestays that stay empty and communities that see none of the money.

## What YatriFlow does

Tell it where you want to go and when. It answers three things:

1. **How crowded that place will actually be** on your date
2. **Which nearby places offer the same kind of trip** with room to breathe
3. **Where you can actually stay there** — so the suggestion is bookable, not just advice

## The pressure model

Most tools would stop at a crowd number. Crowd alone is misleading.

Kedarnath and Manali can both hit a crowd index of 88. They are not the same situation. Manali is a town with hotels, roads and staff; Kedarnath is a high-altitude shrine reached on foot, with almost no capacity to absorb anyone extra. The same crowd does far more damage in one than the other.

So every destination carries two numbers:

- `crowd_baseline` — how busy it normally is
- `capacity_hint` — how much footfall it can absorb

**Pressure** weighs one against the other. It is what the redirect engine ranks on, and it is why a small fragile site scores higher than a large town at an identical crowd level.

The crowd index itself is built from the destination's baseline, its peak and shoulder months, a weekend and Friday spike, and a festival override — a real event on a real date always beats the model.

## How a redirect is chosen

For every destination inside the chosen radius, the engine scores:

| Factor | Weight |
| --- | --- |
| Relief — how much calmer it is | x 0.55 |
| Similarity — same type, then same region | up to +20 |
| Distance — closer is better | up to -25 |
| Bookable — has an available stay | +10 |

A candidate must be meaningfully calmer to appear at all, not merely calmer by a rounding error.

The bookable bonus is deliberate. A suggestion nobody can sleep in redistributes nothing.

## Architecture

All scoring lives in Postgres, not the browser. The client asks a question and renders an answer; it cannot see or change how the answer was reached.



Row Level Security is enabled on every table. Personal data — trips, saved places — is readable only by its owner. Stay listings are publicly readable because guests must be able to browse them, but only the owner can edit or delete one.

## Running it locally

```bash
npm install
npm run dev
```

Create `.env.local` in the project root:

Then run the migrations in the Supabase SQL editor, in order:

1. `yatriflow_phase0.sql` — schema, RLS policies, 62 seeded destinations
2. `yatriflow_phase1.sql` — crowd model and redirect engine

Verify with:

```sql
select * from get_alternatives(1, '2026-10-17', 250, 3);
```

Kedarnath on that date should return three calmer alternatives.

## Honest limitations

- Crowd levels are **modelled estimates**, not live feeds. The model is deterministic and explainable, which matters more at this stage than being live — and `crowd_signals` is where real data plugs in.
- Distance is straight-line. In the Himalaya this understates real travel time; a road-distance factor is the next improvement.
- Coordinates are approximate — fine for ranking, not for navigation.

## Roadmap

- Real crowd signals: ticketing counts, transport bookings, festival calendars
- Road distance and travel time instead of straight-line
- WhatsApp voice onboarding so rural hosts can list a stay by speaking, in their own language
- Impact dashboard: nights redirected, rupees moved to under-visited districts
