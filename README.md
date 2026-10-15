# Orchestrated Depot demo

A browser simulation of electric bus operations with two URL-based demo profiles.

Run `npm ci`, then `npm run dev`. `npm run build` creates the production site in `dist`.

## Demo URLs

- `/` opens the general depot dashboard using the original simulated London data.
- `/Translink` opens the Belfast service-control workshop demo.
- `/Translink/` and lowercase `/translink` also open the Belfast profile.

On production, use `https://depot-orch.netlify.app/Translink` for the workshop.
On a Deploy Preview, add `/Translink` to the preview hostname. The sidebar's arrow link
opens the other demo with a full navigation and fresh in-memory state. The variants share
components and fixes, but have separate starting views, titles, fleet positions, depots
and route data. There is no shared persistent operational data.

`netlify.toml` supplies the SPA rewrite for direct visits and refreshes. Vite emits
root-relative asset URLs so scripts/styles also load under `/Translink/`.

## Controller decision example

The Translink opening view compares the same 15-minute inbound delay against 22 or 12 minutes
of planned layover, protecting an illustrative seven-minute minimum turnaround.
The recommendation changes from monitoring natural recovery to proposing a confirmed
reserve. Removing reserve confirmation requires regulation review; unconfirmed source
data blocks approval. Alternatives require a recorded reason. Approvals update the
simulated vehicle/duty assignment or departure time, pause the clock, and create a
session-only decision record. A reserve is rechecked against the current fleet and
all active duties at approval, preventing double booking. The affected buses can be
highlighted on the map. No commands are sent to external systems.

Rules, timings and readiness assumptions require operator validation. There is no
validated passenger-impact model or live integration, and no operational benefit is
claimed as measured. A third example compares immediate departure with a headway hold:
3/17-minute gaps become 10/10 with a seven-minute hold, subject to illustrative driver
relief slack. It displays on-board passenger-minutes added; waiting demand is context,
not a quantified benefit. The permitted control point and following-bus arrival are
assumptions, not inferred from public route data.

The Belfast fixture is seeded and starts at 05:30 on Monday 19 October 2026. **Reset
whole demo** restores vehicles, duties, chargers, depot loads, alerts, clock, speed,
map highlights and decisions. Changing worked example also resets those states. The
depot selection is retained. The legacy narrative scenario screen and unimplemented
legacy alert actions are excluded from `/Translink`; legacy depot alerts remain
read-only context. General-demo actions also reject occupied reserve vehicles.

Run `npm test` with Node 22.6 or newer to verify the decision rules and approval guards.
Netlify runs these checks before every build. `npm run lint` remains unavailable because
the repository has no ESLint flat config; the production TypeScript build is checked.

## Published Belfast context

The optional public map layers contain 332 central Belfast stop records and selected
G1, G2 and 10A route links. These are public snapshots, separate from the synthetic
fleet, duty and crew data. Stop records include real and virtual points; the selected
bounding box is not a complete Belfast network. Route links can include variants.

- [Stop catalogue](https://www.data.gov.uk/dataset/495c6964-e8d2-4bf1-9942-8d950b3a0ceb/translink-bus-stop-list): resource labelled valid 2 October 2026, filename `bus-stop-export-20260923.xlsx`.
- [Route geography](https://www.data.gov.uk/dataset/6f40b323-1933-40db-97f2-835382029a1f/translink-metro-bus-routes): MapInfo WGS84 snapshot 23 September 2025.
- [DfI statistics](https://www.infrastructure-ni.gov.uk/news/public-transport-statistics-northern-ireland-2024-25-statistical-report-has-been-published-today): 2024–25 Northern Ireland bus context, with fleet figures dated March 2025. Not current or Metro-only fleet data.

Contains Translink data licensed under the [Open Government Licence v3.0](https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/).
`src/data/publicContext.json` records source URLs, dates, input SHA-256 hashes, original
record count, selection boundaries and attribution. Rebuild with
`python scripts/import-public-context.py /path/to/downloaded-snapshots` (requires
openpyxl; files named `stops.xlsx` and `routes.zip`). The files are official catalogue
downloads, not API responses. No runtime stop/route API requests are required; the
OpenStreetMap basemap still needs internet access.

The expanded public-data panel also identifies the published September 2026
TransXChange timetable export and Translink Transport Information API as future
integration candidates. Timetable date/day exceptions, trip-to-block matching and
API usage agreements need validation before integration. Neither source establishes
vehicle availability, crew relief constraints or passenger occupancy.

## Map

The Translink map shows Milewater Service Centre, Falls Road Depot and Short Strand Depot.
Selecting a depot centres the map on it. The layers button in the map controls restores
the view of all three Belfast sites. Buses and chargers remain visible across the network;
the statistics panel describes the depot selected in the header.

The basemap uses standard OpenStreetMap tiles, without an API key. Both app themes use
the same street map. Keep the visible attribution, default browser caching and HTTP
referrers. Do not bulk download or prefetch tiles for offline use. The service requires
internet access and has no availability guarantee. Review the
[tile usage policy](https://operations.osmfoundation.org/policies/tiles/) before expanding use.

The former CARTO raster endpoint now requires an API key and otherwise returns images
reading “API KEY REQUIRED”; see the [CARTO FAQ](https://docs.carto.com/faqs/carto-basemaps).

## Data boundaries and location sources

Depot coordinates are approximate public site locations. Parking positions, charger
layouts, vehicle allocations, route traces, schedules, faults, energy figures and
integration status indicators are synthetic. They do not represent live Translink
operations or actual charging infrastructure. Route IDs are demo identifiers, not a
representation of official Belfast services. Older files in `js/` are unused legacy
prototype code; Vite serves the React application in `src/`.

Sources checked on 15 October 2026:

- [Translink depot list](https://www.translink.co.uk/getmedia/069f13bb-25d1-4a44-902e-2f34aacae838/Bus-Driver-Recruitment-July-2025.pdf): confirms the three Belfast depot names.
- [Milewater Service Centre](https://mapcarta.com/W1447681474): OpenStreetMap-derived approximate building centre, 54.61802, -5.91547.
- [Falls Road depot](https://mapcarta.com/W134903793): OpenStreetMap-derived approximate building centre, 54.58527, -5.97948.
- [Short Strand depot photograph and location](https://www.geograph.org.uk/photo/1524885): approximate subject location, 54.59799, -5.91162.
- [Belfast City Council planning record](https://minutes.belfastcity.gov.uk/documents/g12340/Public%20reports%20pack%2009th-Dec-2025%2017.00%20Planning%20Committee.pdf?T=10): confirms Short Strand Depot on Mountpottinger Road.

The internal IDs `central`, `north` and `east` are retained so the existing demonstration
duties and fault scenarios keep their references. Display names provide the Belfast sites.
