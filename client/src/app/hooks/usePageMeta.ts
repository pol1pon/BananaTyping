import { useEffect } from "react";

interface PageMetaOptions {
  title: string;
  description?: string;
  canonicalPath?: string;
  noIndex?: boolean;
}

function upsertMeta(selector: string, attrName: "name" | "property", attrValue: string, content: string) {
  let el = document.querySelector<HTMLMetaElement>(selector);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attrName, attrValue);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

export function usePageMeta({
  title,
  description,
  canonicalPath,
  noIndex = false,
}: PageMetaOptions) {
  useEffect(() => {
    document.title = title;

    if (description) {
      upsertMeta('meta[name="description"]', "name", "description", description);
      upsertMeta('meta[property="og:description"]', "property", "og:description", description);
    }

    upsertMeta('meta[property="og:title"]', "property", "og:title", title);
    upsertMeta(
      'meta[name="robots"]',
      "name",
      "robots",
      noIndex
        ? "noindex, nofollow"
        : "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1"
    );

    if (canonicalPath !== undefined) {
      let link = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
      if (!link) {
        link = document.createElement("link");
        link.setAttribute("rel", "canonical");
        document.head.appendChild(link);
      }
      const origin = typeof window !== "undefined" ? window.location.origin : "https://67monster.pro";
      link.setAttribute("href", `${origin}${canonicalPath}`);
    }
  }, [title, description, canonicalPath, noIndex]);
}
