import context from "../../data/publicContext.json";

export function PublicContext() {
  return (
    <details className="glass-card p-4 text-sm text-slate-300">
      <summary className="cursor-pointer font-medium text-blue-300">
        Public data, provenance and information to validate
      </summary>
      <div className="grid md:grid-cols-2 gap-5 mt-4 text-xs leading-relaxed">
        <div className="space-y-2">
          <p>
            <a
              className="text-blue-300 underline"
              href={context.metadata.stopsUrl}
              target="_blank"
              rel="noreferrer"
            >
              Translink stop catalogue
            </a>{" "}
            · catalogue dated 2 October 2026; export filename dated 23
            September. The map contains {context.stops.length} central Belfast
            records from {context.metadata.totalStopRecords.toLocaleString()}{" "}
            across Northern Ireland. Records include real and virtual stops;
            this is a geographic subset.
          </p>
          <p>
            <a
              className="text-blue-300 underline"
              href={context.metadata.routesUrl}
              target="_blank"
              rel="noreferrer"
            >
              Metro / Glider route geometry
            </a>{" "}
            · 23 September 2025 snapshot. Optional G1, G2 and 10A layers retain
            published route links and variants. These do not establish current
            service frequency or operating duties.
          </p>
          <p>
            {context.metadata.attribution}{" "}
            <a
              href="https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/"
              className="underline text-blue-300"
              target="_blank"
              rel="noreferrer"
            >
              Licence
            </a>
            . Bundled 15 October 2026; no runtime data API is required.
          </p>
          <p>
            <a
              href="https://www.infrastructure-ni.gov.uk/news/public-transport-statistics-northern-ireland-2024-25-statistical-report-has-been-published-today"
              className="text-blue-300 underline"
              target="_blank"
              rel="noreferrer"
            >
              DfI 2024–25 context
            </a>
            : 67.8 million bus passenger journeys; 1,420 buses at March 2025;
            15.0% zero-emission. These cover Northern Ireland bus operations,
            not this simulated fleet or today's Metro fleet.
          </p>
        </div>
        <div className="space-y-2">
          <p className="font-medium text-white">
            Useful inputs for a contained proof of value
          </p>
          <ul className="list-disc pl-4 space-y-1">
            <li>
              Timestamped AVL, trip matching and predicted arrival confidence.
            </li>
            <li>
              Current timetable, vehicle blocks, layover rules and permitted
              regulation points.
            </li>
            <li>
              Driver duties, relief constraints, accessibility, usable reserves
              and charging readiness.
            </li>
            <li>
              Passenger loads and waiting-demand estimates, with quality and age
              visible.
            </li>
            <li>
              Baseline controller decision time, headway variation, missed trips
              and lost mileage; agree success measures together.
            </li>
          </ul>
          <p>
            The{" "}
            <a
              className="underline text-blue-300"
              href="https://admin.opendatani.gov.uk/dataset/metro-timetable-data-valid-from-18-june-until-31-august-2016"
              target="_blank"
              rel="noreferrer"
            >
              Metro / Glider timetable catalogue
            </a>{" "}
            also has a September 2026 TransXChange export. Operating dates,
            weekdays and exceptions need validation before using it in dispatch;
            no public timetable is used as a vehicle or crew duty here.
          </p>
          <p>
            Translink's{" "}
            <a
              className="underline text-blue-300"
              href="https://admin.opendatani.gov.uk/dataset/https-www-opendatani-gov-uk-translink-translink-transport-information-api"
              target="_blank"
              rel="noreferrer"
            >
              Transport Information API
            </a>{" "}
            is a possible future integration subject to its access and usage
            agreement. No live connection or operational command is enabled.
          </p>
        </div>
      </div>
    </details>
  );
}
