import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { JsonLd } from "./JsonLd";

describe("JsonLd", () => {
  it("renders the payload as application/ld+json", () => {
    const { container } = render(<JsonLd data={{ name: "Palmeiras" }} />);
    const script = container.querySelector(
      'script[type="application/ld+json"]',
    );
    expect(script).not.toBeNull();
    expect(JSON.parse(script!.innerHTML)).toEqual({ name: "Palmeiras" });
  });

  it("escapes < so feed-derived strings cannot break out of the script block", () => {
    const hostile = { name: "</script><script>alert(1)</script>" };
    const { container } = render(<JsonLd data={hostile} />);
    const script = container.querySelector(
      'script[type="application/ld+json"]',
    );
    expect(script!.innerHTML).not.toContain("</script>");
    expect(script!.innerHTML).toContain("\\u003c");
    // The escaped form still parses back to the identical data.
    expect(JSON.parse(script!.innerHTML)).toEqual(hostile);
  });
});
