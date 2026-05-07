export function parseSvg(svg: string): Document | null {
  try {
    const parser = new DOMParser();
    return parser.parseFromString(svg, "image/svg+xml");
  } catch {
    return null;
  }
}

export function serializeSvg(doc: Document): string {
  return new XMLSerializer().serializeToString(doc);
}
