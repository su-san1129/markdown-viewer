import { useEffect, useMemo, useRef, useState } from "react";
import DxfParser from "dxf-parser";
import type { ViewerPlugin } from "../types";

type Point = { x: number; y: number; };

type Primitive =
  | { kind: "line"; start: Point; end: Point; }
  | { kind: "polyline"; points: Point[]; closed: boolean; }
  | { kind: "circle"; center: Point; radius: number; }
  | { kind: "arc"; center: Point; radius: number; startAngle: number; endAngle: number; };

interface ParsedDxf {
  primitives: Primitive[];
  bounds: { minX: number; minY: number; maxX: number; maxY: number; };
}

function toRadians(angle: number): number {
  if (Math.abs(angle) > Math.PI * 2) {
    return (angle * Math.PI) / 180;
  }
  return angle;
}

function parseDxf(content: string): ParsedDxf {
  const parser = new DxfParser();
  const result = parser.parseSync(content) as { entities?: unknown[]; };
  const entities = result.entities ?? [];

  const primitives: Primitive[] = [];

  const bounds = {
    minX: Number.POSITIVE_INFINITY,
    minY: Number.POSITIVE_INFINITY,
    maxX: Number.NEGATIVE_INFINITY,
    maxY: Number.NEGATIVE_INFINITY
  };

  const update = (p: Point) => {
    bounds.minX = Math.min(bounds.minX, p.x);
    bounds.minY = Math.min(bounds.minY, p.y);
    bounds.maxX = Math.max(bounds.maxX, p.x);
    bounds.maxY = Math.max(bounds.maxY, p.y);
  };

  for (const entity of entities as Record<string, unknown>[]) {
    const type = String(entity.type ?? "");

    if (type === "LINE") {
      const start = entity.start as Point | undefined;
      const end = entity.end as Point | undefined;
      if (!start || !end) continue;
      primitives.push({ kind: "line", start, end });
      update(start);
      update(end);
      continue;
    }

    if (type === "LWPOLYLINE" || type === "POLYLINE") {
      const rawVertices = (entity.vertices as Point[] | undefined) ?? [];
      if (rawVertices.length < 2) continue;
      const points = rawVertices.map((v) => ({ x: v.x, y: v.y }));
      const closed = Boolean(entity.shape ?? entity.closed);
      primitives.push({ kind: "polyline", points, closed });
      for (const p of points) update(p);
      continue;
    }

    if (type === "CIRCLE") {
      const center = entity.center as Point | undefined;
      const radius = Number(entity.radius ?? 0);
      if (!center || radius <= 0) continue;
      primitives.push({ kind: "circle", center, radius });
      update({ x: center.x - radius, y: center.y - radius });
      update({ x: center.x + radius, y: center.y + radius });
      continue;
    }

    if (type === "ARC") {
      const center = entity.center as Point | undefined;
      const radius = Number(entity.radius ?? 0);
      const startAngle = toRadians(Number(entity.startAngle ?? 0));
      const endAngle = toRadians(Number(entity.endAngle ?? 0));
      if (!center || radius <= 0) continue;
      primitives.push({ kind: "arc", center, radius, startAngle, endAngle });
      update({ x: center.x - radius, y: center.y - radius });
      update({ x: center.x + radius, y: center.y + radius });
      continue;
    }
  }

  if (!Number.isFinite(bounds.minX)) {
    bounds.minX = 0;
    bounds.minY = 0;
    bounds.maxX = 1;
    bounds.maxY = 1;
  }

  return { primitives, bounds };
}

function DxfCanvasViewer({ content }: { content: string; }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  const parsed = useMemo(() => {
    try {
      setError(null);
      return parseDxf(content);
    } catch (err) {
      setError(`Failed to parse DXF: ${String(err)}`);
      return null;
    }
  }, [content]);

  useEffect(() => {
    if (!parsed || !canvasRef.current || !containerRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = Math.max(containerRef.current.clientWidth, 480);
    const height = Math.max(containerRef.current.clientHeight, 320);
    const dpr = window.devicePixelRatio || 1;

    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "var(--bg-main)";
    ctx.fillRect(0, 0, width, height);

    const pad = 24;
    const worldW = Math.max(parsed.bounds.maxX - parsed.bounds.minX, 1);
    const worldH = Math.max(parsed.bounds.maxY - parsed.bounds.minY, 1);
    const scale = Math.min((width - pad * 2) / worldW, (height - pad * 2) / worldH);

    const xOffset = (width - worldW * scale) / 2;
    const yOffset = (height - worldH * scale) / 2;

    const map = (p: Point): Point => ({
      x: xOffset + (p.x - parsed.bounds.minX) * scale,
      y: height - (yOffset + (p.y - parsed.bounds.minY) * scale)
    });

    ctx.strokeStyle = "#6bb5f6";
    ctx.lineWidth = 1.2;

    for (const primitive of parsed.primitives) {
      ctx.beginPath();

      if (primitive.kind === "line") {
        const a = map(primitive.start);
        const b = map(primitive.end);
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
        continue;
      }

      if (primitive.kind === "polyline") {
        const first = map(primitive.points[0]);
        ctx.moveTo(first.x, first.y);
        for (let i = 1; i < primitive.points.length; i += 1) {
          const p = map(primitive.points[i]);
          ctx.lineTo(p.x, p.y);
        }
        if (primitive.closed) {
          ctx.closePath();
        }
        ctx.stroke();
        continue;
      }

      if (primitive.kind === "circle") {
        const c = map(primitive.center);
        ctx.arc(c.x, c.y, primitive.radius * scale, 0, Math.PI * 2);
        ctx.stroke();
        continue;
      }

      if (primitive.kind === "arc") {
        const c = map(primitive.center);
        ctx.arc(
          c.x,
          c.y,
          primitive.radius * scale,
          -primitive.startAngle,
          -primitive.endAngle,
          true
        );
        ctx.stroke();
      }
    }
  }, [parsed]);

  if (error) {
    return <p style={{ color: "#f14c4c" }}>{error}</p>;
  }

  if (!parsed || parsed.primitives.length === 0) {
    return <p style={{ color: "var(--text-secondary)" }}>No renderable DXF entities found.</p>;
  }

  return (
    <div
      ref={containerRef}
      style={{
        width: "100%",
        height: "100%",
        minHeight: 360,
        border: "1px solid var(--border-color)",
        borderRadius: 8,
        overflow: "hidden"
      }}
    >
      <canvas ref={canvasRef} />
    </div>
  );
}

export const dxfViewerPlugin: ViewerPlugin = {
  id: "dxf",
  label: "DXF",
  extensions: ["dxf"],
  supportsFind: false,
  render({ content }) {
    return <DxfCanvasViewer content={content} />;
  }
};
