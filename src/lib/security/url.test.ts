import { describe, it, expect } from "vitest";
import { isSafeHttpUrl, safeUrl } from "./url";

describe("isSafeHttpUrl", () => {
  it("accepts http(s) absolute URLs", () => {
    expect(isSafeHttpUrl("https://example.com/a")).toBe(true);
    expect(isSafeHttpUrl("http://example.com")).toBe(true);
  });
  it("accepts same-app relative paths", () => {
    expect(isSafeHttpUrl("/news")).toBe(true);
    expect(isSafeHttpUrl("/squad/vitor-roque")).toBe(true);
  });
  it("rejects dangerous schemes", () => {
    expect(isSafeHttpUrl("javascript:alert(1)")).toBe(false);
    expect(isSafeHttpUrl("data:text/html,<script>1</script>")).toBe(false);
    expect(isSafeHttpUrl("vbscript:msgbox(1)")).toBe(false);
    expect(isSafeHttpUrl("file:///etc/passwd")).toBe(false);
  });
  it("rejects protocol-relative and empty/invalid", () => {
    expect(isSafeHttpUrl("//evil.com")).toBe(false);
    expect(isSafeHttpUrl("")).toBe(false);
    expect(isSafeHttpUrl("   ")).toBe(false);
    expect(isSafeHttpUrl(undefined)).toBe(false);
    expect(isSafeHttpUrl("not a url")).toBe(false);
  });
});

describe("safeUrl", () => {
  it("passes through safe URLs", () => {
    expect(safeUrl("https://example.com")).toBe("https://example.com");
    expect(safeUrl("  https://example.com  ")).toBe("https://example.com");
  });
  it("collapses unsafe URLs to the fallback", () => {
    expect(safeUrl("javascript:alert(1)")).toBe("#");
    expect(safeUrl("javascript:alert(1)", "/")).toBe("/");
    expect(safeUrl(undefined)).toBe("#");
  });
});
