/**
 * Renders a JSON-LD structured-data block. Inline <script> is permitted by the
 * site CSP (script-src includes 'unsafe-inline'); the content is data, not
 * executable JS. Keep the payload to verified facts only.
 */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      // Data is built from typed domain models, not user input.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
