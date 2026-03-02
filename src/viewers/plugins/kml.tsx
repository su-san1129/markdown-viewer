import { useEffect, useState } from "react";
import { readKml } from "../../lib/tauri";
import { parseGeoJson } from "../geojson";
import { GeoJsonMapViewer } from "./geojson";
import type { ViewerPlugin } from "../types";

function KmlViewer({ filePath, contentRef }: {
  filePath: string;
  contentRef: React.RefObject<HTMLDivElement | null>;
}) {
  const [geojson, setGeojson] = useState<GeoJSON.GeoJsonObject | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    readKml(filePath)
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
        <p style={{ color: "#f14c4c" }}>KML file loading failed: {error}</p>
      </div>
    );
  }

  if (!geojson) {
    return (
      <div ref={contentRef} style={{ padding: "var(--sp-4)" }}>
        <p>Loading KML...</p>
      </div>
    );
  }

  return <GeoJsonMapViewer geojson={geojson} contentRef={contentRef} />;
}

export const kmlViewerPlugin: ViewerPlugin = {
  id: "kml",
  label: "KML",
  extensions: ["kml", "kmz"],
  supportsFind: false,
  render({ filePath, contentRef }) {
    return <KmlViewer filePath={filePath} contentRef={contentRef} />;
  }
};
