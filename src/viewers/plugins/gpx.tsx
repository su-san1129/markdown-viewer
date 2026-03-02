import { useEffect, useState } from "react";
import { readGpx } from "../../lib/tauri";
import { parseGeoJson } from "../geojson";
import { GeoJsonMapViewer } from "./geojson";
import type { ViewerPlugin } from "../types";

function GpxViewer({ filePath, contentRef }: {
  filePath: string;
  contentRef: React.RefObject<HTMLDivElement | null>;
}) {
  const [geojson, setGeojson] = useState<GeoJSON.GeoJsonObject | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    readGpx(filePath)
      .then((data) => {
        if (cancelled) return;
        const result = parseGeoJson(data.geojson);
        if (result.ok) {
          setGeojson(result.geojson);
        } else {
          setError(result.reason);
        }
      })
      .catch((err) => {
        if (!cancelled) setError(String(err));
      });
    return () => {
      cancelled = true;
    };
  }, [filePath]);

  if (error) {
    return (
      <div ref={contentRef} style={{ padding: "var(--sp-4)" }}>
        <p style={{ color: "#f14c4c" }}>GPX file loading failed: {error}</p>
      </div>
    );
  }

  if (!geojson) {
    return (
      <div ref={contentRef} style={{ padding: "var(--sp-4)" }}>
        <p>Loading GPX...</p>
      </div>
    );
  }

  return <GeoJsonMapViewer geojson={geojson} contentRef={contentRef} />;
}

export const gpxViewerPlugin: ViewerPlugin = {
  id: "gpx",
  label: "GPX",
  extensions: ["gpx"],
  supportsFind: false,
  render({ filePath, contentRef }) {
    return <GpxViewer filePath={filePath} contentRef={contentRef} />;
  }
};
