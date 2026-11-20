/**
 * In-document text search for HTML based renderers (docx, text, slides).
 * Matches are wrapped in <mark class="oth-hit"> elements and removed again
 * by {@link TextSearch.clear}; the original text nodes are restored.
 */
export interface SearchOptions {
  matchCase?: boolean;
}

export interface SearchState {
  query: string;
  total: number;
  /** 0-based index of the active match, -1 if none. */
  current: number;
}

const SKIP = new Set(["SCRIPT", "STYLE", "TEXTAREA", "INPUT", "SELECT", "OPTION", "NOSCRIPT"]);

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export class TextSearch {
  private marks: HTMLElement[] = [];
  private index = -1;
  private query = "";

  constructor(private readonly root: HTMLElement) {}

  get state(): SearchState {
    return { query: this.query, total: this.marks.length, current: this.index };
  }

  /** Highlights all matches and activates the first one. Returns the number of matches. */
  find(query: string, options: SearchOptions = {}): SearchState {
    this.clear();
    this.query = query;
    if (!query) return this.state;
    const re = new RegExp(escapeRegExp(query), options.matchCase ? "g" : "gi");
    const walker = document.createTreeWalker(this.root, NodeFilter.SHOW_TEXT, {
      acceptNode: (node) => {
        const parent = node.parentElement;
        if (!parent || SKIP.has(parent.tagName) || parent.closest(".oth-search-ignore")) return NodeFilter.FILTER_REJECT;
        return node.nodeValue && node.nodeValue.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
      },
    });
    const nodes: Text[] = [];
    while (walker.nextNode()) nodes.push(walker.currentNode as Text);

    for (const node of nodes) {
      const text = node.nodeValue ?? "";
      const ranges: Array<[number, number]> = [];
      re.lastIndex = 0;
      let m: RegExpExecArray | null;
      while ((m = re.exec(text))) {
        ranges.push([m.index, m.index + m[0].length]);
        if (m[0].length === 0) re.lastIndex++;
      }
      if (!ranges.length) continue;
      const frag = document.createDocumentFragment();
      let last = 0;
      for (const [s, e] of ranges) {
        if (s > last) frag.append(text.slice(last, s));
        const mark = document.createElement("mark");
        mark.className = "oth-hit";
        mark.textContent = text.slice(s, e);
        frag.append(mark);
        this.marks.push(mark);
        last = e;
      }
      if (last < text.length) frag.append(text.slice(last));
      node.parentNode?.replaceChild(frag, node);
    }
    if (this.marks.length) this.activate(0);
    return this.state;
  }

  next(): SearchState {
    if (this.marks.length) this.activate((this.index + 1) % this.marks.length);
    return this.state;
  }

  previous(): SearchState {
    if (this.marks.length) this.activate((this.index - 1 + this.marks.length) % this.marks.length);
    return this.state;
  }

  /** Removes all highlights. */
  clear(): void {
    const parents = new Set<Node>();
    for (const mark of this.marks) {
      const parent = mark.parentNode;
      if (!parent) continue;
      parent.replaceChild(document.createTextNode(mark.textContent ?? ""), mark);
      parents.add(parent);
    }
    parents.forEach((p) => (p as Element).normalize?.());
    this.marks = [];
    this.index = -1;
    this.query = "";
  }

  private activate(i: number): void {
    this.marks[this.index]?.classList.remove("oth-hit-active");
    this.index = i;
    const mark = this.marks[i];
    if (!mark) return;
    mark.classList.add("oth-hit-active");
    try {
      mark.scrollIntoView?.({ block: "center", inline: "nearest", behavior: "smooth" });
    } catch {
      mark.scrollIntoView?.();
    }
  }
}
