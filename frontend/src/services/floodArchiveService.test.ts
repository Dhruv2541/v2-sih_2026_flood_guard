import test from 'node:test';
import assert from 'node:assert/strict';
import {
  floodArchiveService,
  parseFloodEventsCSV,
  parseProofSourcesCSV,
  VERIFIED_EVENTS_CSV_RAW,
  VERIFIED_SOURCES_CSV_RAW,
} from './floodArchiveService.ts';

test('parseFloodEventsCSV parses all 8 years from 2018 to 2025', () => {
  const events = parseFloodEventsCSV(VERIFIED_EVENTS_CSV_RAW);
  assert.equal(events.length, 8, 'Expected exactly 8 years of flood records');

  const years = events.map((e) => e.year);
  assert.deepEqual(years, [2025, 2024, 2023, 2022, 2021, 2020, 2019, 2018]);
});

test('2024 matches verified CSV snapshot exactly without invented values', () => {
  const event2024 = floodArchiveService.getEventByYear(2024);
  assert.ok(event2024, '2024 event must exist');

  // Must match CSV: population_affected_lakh = 42.95611, crop_area = 0.4958043, deaths = 121, villages = 7794, districts = 35
  assert.equal(event2024.population_affected_lakh, 42.95611);
  assert.equal(event2024.crop_area_affected_lakh_ha, 0.4958043);
  assert.equal(event2024.human_lives_lost, 121);
  assert.equal(event2024.villages_affected, 7794);
  assert.equal(event2024.districts_affected, 35);

  // Missing values in CSV must be null, NOT invented numbers
  assert.equal(event2024.total_damage_crore, null);
  assert.equal(event2024.cattle_lost, null);
  assert.ok(event2024.source.includes('Flood Memorandum on Assam Floods 2024'));
});

test('2025 preserves missing crop area and economic damage as null', () => {
  const event2025 = floodArchiveService.getEventByYear(2025);
  assert.ok(event2025, '2025 event must exist');

  assert.equal(event2025.population_affected_lakh, 11.19);
  assert.equal(event2025.human_lives_lost, 36);
  assert.equal(event2025.villages_affected, 3255);
  assert.equal(event2025.districts_affected, 28);

  // Crop area and damage must be null
  assert.equal(event2025.crop_area_affected_lakh_ha, null);
  assert.equal(event2025.total_damage_crore, null);
  assert.equal(event2025.cattle_lost, null);
  assert.ok(event2025.source.includes('Economic Survey Assam 2025-26'));
});

test('2022 catastrophic figures match verified ASDMA and NRSC returns', () => {
  const event2022 = floodArchiveService.getEventByYear(2022);
  assert.ok(event2022, '2022 event must exist');

  assert.equal(event2022.population_affected_lakh, 57.5);
  assert.equal(event2022.crop_area_affected_lakh_ha, 1.08);
  assert.equal(event2022.human_lives_lost, 179);
  assert.equal(event2022.cattle_lost, 2700);
  assert.equal(event2022.total_damage_crore, 10000);
  assert.equal(event2022.villages_affected, 10106);
  assert.equal(event2022.districts_affected, 35);
});

test('2021 numbers match Table 3.2 without invention', () => {
  const event2021 = floodArchiveService.getEventByYear(2021);
  assert.ok(event2021, '2021 event must exist');

  assert.equal(event2021.population_affected_lakh, 5.74);
  assert.equal(event2021.crop_area_affected_lakh_ha, 0.65);
  assert.equal(event2021.human_lives_lost, 3);
  assert.equal(event2021.cattle_lost, 13);
  assert.equal(event2021.total_damage_crore, null);
});

test('proof sources CSV contains valid URLs from official domains', () => {
  const sources = parseProofSourcesCSV(VERIFIED_SOURCES_CSV_RAW);
  assert.ok(sources.length >= 8, 'Expected at least 8 proof sources');

  for (const src of sources) {
    assert.ok(src.url.startsWith('https://'), `Source URL must be secure: ${src.url}`);
    assert.ok(
      src.url.includes('nrsc.gov.in') ||
        src.url.includes('asdma.assam.gov.in') ||
        src.url.includes('bhuvan-app1.nrsc.gov.in'),
      `URL must originate from verified government/ISRO domains: ${src.url}`
    );
    assert.ok(src.what_it_proves.length > 5, 'Must state what it proves');
  }
});

test('satellite evidence is provided for monitored years with specific acquisition dates', () => {
  const sat2024 = floodArchiveService.getSatelliteEvidenceForYear(2024);
  assert.ok(sat2024, 'Satellite evidence for 2024 must exist');
  assert.ok(sat2024.acquisitionDate?.includes('9 August 2024'));
  assert.ok(sat2024.url.includes('ndem.nrsc.gov.in'));

  const sat2018 = floodArchiveService.getSatelliteEvidenceForYear(2018);
  assert.ok(sat2018, 'Satellite evidence for 2018 must exist');
  assert.ok(sat2018.sensor?.includes('RADARSAT-2'));
});
