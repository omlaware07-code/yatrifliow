-- ============================================================
-- YatriFlow — Phase 2
-- ASI-calibrated baselines and footfall-based forecast signals
--
-- Source: India Tourism Statistics 2023 (Ministry of Tourism),
--         Table 5.2.3 — 115 centrally protected ticketed monuments
--         + ASI monument footfall, FY 2024-25
-- Run after phase0.sql and phase1.sql
-- ============================================================

-- 1. Heritage destinations that appear in the ASI dataset
insert into public.destinations
  (id, name, state, region, type, lat, lng, crowd_baseline, capacity_hint, peak_months, blurb)
values
  (63,'Sun Temple, Konark','Odisha','Deccan','Heritage',19.8876,86.0945,84,55,'{11,12,1,2}','Chariot temple on the Bay of Bengal.'),
  (64,'Elephanta Caves','Maharashtra','Konkan','Heritage',18.9633,72.9315,75,35,'{11,12,1,2}','Rock-cut Shiva caves, a ferry from Mumbai.'),
  (65,'Golconda Fort','Telangana','Deccan','Heritage',17.3833,78.4011,83,60,'{11,12,1,2}','Granite citadel with famous acoustics.'),
  (66,'Daulatabad Fort','Maharashtra','Deccan','Heritage',19.9430,75.2190,76,45,'{11,12,1,2}','Hill fort on the way to Ellora.'),
  (67,'Qutub Minar','Delhi','Deccan','Heritage',28.5245,77.1855,83,70,'{11,12,1,2}','Brick minaret in the Mehrauli complex.'),
  (68,'Taj Mahal','Uttar Pradesh','Deccan','Heritage',27.1751,78.0421,85,60,'{11,12,1,2}','The most visited ticketed monument in India.'),
  (69,'Fatehpur Sikri','Uttar Pradesh','Desert','Heritage',27.0940,77.6610,75,50,'{11,12,1,2}','Akbar''s abandoned capital, 40 km from Agra.'),
  (70,'Chittaurgarh Fort','Rajasthan','Desert','Heritage',24.8887,74.6269,78,55,'{10,11,12,1}','The largest fort in India.')
on conflict (id) do nothing;

-- 2. Baselines from ASI percentile rank (FY2022-23, 115 monuments)
update public.destinations set crowd_baseline = 74 where id = 41;  -- Ajanta: 4,01,086 domestic, 81st pct
update public.destinations set crowd_baseline = 82 where id = 42;  -- Ellora: 14,37,560, 95th pct
update public.destinations set crowd_baseline = 73 where id = 35;  -- Kumbhalgarh: 3,89,625, 80th pct

-- 3. Forecast signals from measured 2-year growth (FY22-23 -> FY24-25)
--    Each rate is per-monument and measured, not assumed.
insert into public.crowd_signals (destination_id, signal_date, crowd_index, source) values
  (41, '2027-01-15', 74, 'forecast'),  -- Ajanta        +7.4%/yr
  (42, '2027-01-15', 82, 'forecast'),  -- Ellora       +10.7%/yr
  (63, '2027-01-15', 99, 'forecast'),  -- Konark       +21.9%/yr
  (64, '2027-01-15', 76, 'forecast'),  -- Elephanta     +8.3%/yr
  (65, '2027-01-15', 59, 'forecast'),  -- Golconda      +1.7%/yr
  (66, '2027-01-15', 63, 'forecast'),  -- Daulatabad    +3.2%/yr
  (69, '2027-12-20', 38, 'forecast'),  -- Fatehpur Sikri -6.9%/yr (declining)
  (70, '2026-12-20', 94, 'forecast'),  -- Chittaurgarh +15.5%/yr
  (35, '2026-12-20', 55, 'forecast')   -- Kumbhalgarh   -0.2%/yr
on conflict (destination_id, signal_date, source) do update
  set crowd_index = excluded.crowd_index;

-- 4. Festival overrides — a real event always beats the model
insert into public.crowd_signals (destination_id, signal_date, crowd_index, source) values
  (1,  '2026-10-17', 98, 'festival'),
  (31, '2026-12-20', 96, 'festival'),
  (9,  '2027-02-26', 94, 'festival')
on conflict (destination_id, signal_date, source) do update
  set crowd_index = excluded.crowd_index;