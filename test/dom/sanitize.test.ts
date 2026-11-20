// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { isSafeHref, sanitizeHtml, sanitizeToFragment } from "../../src/core/sanitize";
import { TextSearch } from "../../src/core/search";

const html = (frag: DocumentFragment) => {
  const d = document.createElement("div");
  d.appendChild(frag);
  return d;
};

describe("sanitizer", () => {
  it("removes scripts, event handlers and dangerous URLs", () => {
    const d = html(
      sanitizeToFragment(
        `<p onclick="x()">a<script>alert(1)</script></p><a href="javascript:alert(1)">j</a><a href=" JaVaScRiPt:alert(1)">j2</a>` +
          `<a href="vbscript:x">v</a><a href="data:text/html,<script>x</script>">d</a><img src="javascript:x"><iframe src="x"></iframe>` +
          `<svg><script>x</script></svg><form action="x"><input></form>`,
      ),
    );
    expect(d.querySelector("script,iframe,svg,form,input")).toBeNull();
    expect(d.querySelector("[onclick]")).toBeNull();
    for (const a of d.querySelectorAll("a")) expect(a.hasAttribute("href")).toBe(false);
    expect(d.querySelector("img")?.hasAttribute("src")).toBe(false);
  });

  it("keeps safe content and opens external links safely", () => {
    const d = html(
      sanitizeToFragment(`<h1>T</h1><a href="https://example.com">x</a><a href="#footnote-1">1</a><img src="data:image/png;base64,AAAA" alt="i"><table><tr><td colspan="2">c</td></tr></table>`, { idPrefix: "p-" }),
    );
    const ext = d.querySelector('a[href^="https"]')!;
    expect(ext.getAttribute("target")).toBe("_blank");
    expect(ext.getAttribute("rel")).toContain("noopener");
    expect(d.querySelector('a[href="#p-footnote-1"]')).not.toBeNull();
    expect(d.querySelector("img")!.getAttribute("src")).toMatch(/^data:image\/png/);
    expect(d.querySelector("td")!.getAttribute("colspan")).toBe("2");
  });

  it("does not allow SVG data URLs as images", () => {
    const d = html(sanitizeToFragment(`<img src="data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=">`));
    expect(d.querySelector("img")!.hasAttribute("src")).toBe(false);
  });

  it("prefixes ids against DOM clobbering", () => {
    const d = html(sanitizeToFragment(`<p id="config">x</p><a name="getElementById">y</a>`));
    expect(d.querySelector("#oth-config")).not.toBeNull();
    // DOMPurify drops clobbering names entirely; anything left is prefixed
    expect(d.querySelector("a")!.getAttribute("name") ?? "oth-").toMatch(/^oth-/);
  });

  it("drops style unless allowed", () => {
    expect(sanitizeHtml(`<p style="color:red">x</p>`)).toBe("<p>x</p>");
    expect(sanitizeHtml(`<p style="color:red">x</p>`, { allowStyle: true })).toContain("color");
  });

  it("isSafeHref", () => {
    expect(isSafeHref("https://a")).toBe(true);
    expect(isSafeHref("relative/page.html")).toBe(true);
    expect(isSafeHref("javascript:1")).toBe(false);
  });
});

describe("TextSearch", () => {
  it("highlights, cycles and restores the text", () => {
    const root = document.createElement("div");
    root.innerHTML = "<p>Alpha beta ALPHA</p><p>gamma alpha</p>";
    document.body.appendChild(root);
    const s = new TextSearch(root);
    expect(s.find("alpha").total).toBe(3);
    expect(root.querySelectorAll("mark.oth-hit").length).toBe(3);
    expect(s.next().current).toBe(1);
    expect(s.previous().current).toBe(0);
    expect(s.previous().current).toBe(2);
    expect(s.find("alpha", { matchCase: true }).total).toBe(1);
    s.clear();
    expect(root.querySelector("mark")).toBeNull();
    expect(root.innerHTML).toBe("<p>Alpha beta ALPHA</p><p>gamma alpha</p>");
  });

  it("treats the query literally (no regex injection)", () => {
    const root = document.createElement("div");
    root.textContent = "a.b a*b (x)";
    expect(new TextSearch(root).find("(x)").total).toBe(1);
    expect(new TextSearch(root).find(".*").total).toBe(0);
  });
});
