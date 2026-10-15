# Orchestrated Depot demo

A browser simulation of electric bus depot operations, set in Belfast.

Run `npm ci`, then `npm run dev`. `npm run build` creates the production site in `dist`.

## Controller decision example

The opening view compares the same 15-minute inbound delay against 22 or 12 minutes
of planned layover, protecting an illustrative seven-minute minimum turnaround.
The recommendation changes from monitoring natural recovery to proposing a confirmed
reserve. Removing reserve confirmation requires regulation review; unconfirmed source
data blocks approval. Alternatives require a recorded reason. Approvals create a
session-only decision record and simulated hand-off acknowledgements, retained across
navigation. No commands are sent to external systems.

Rules, timings and readiness assumptions require operator validation. There is no
passenger-impact model or live integration, and no operational benefit is claimed as
measured. The older depot simulation starts paused. The older scenario screen remains
a narrative walkthrough.

Run `npm test` with Node 22.6 or newer to verify the decision rules and approval guards.

## Map

The initial map shows Milewater Service Centre, Falls Road Depot and Short Strand Depot.
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
