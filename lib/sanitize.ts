// Portfolyo siteleri kullanıcı tarafından sağlanan/üretilen HTML içerebilir.
// SERT KURAL: bu HTML render edilmeden ÖNCE mutlaka sanitize edilir (XSS riski).
// İzin verilen etiket/öznitelik allowlist'i dar tutulur; script, event handler
// ve tehlikeli URL şemaları kaldırılır.
import DOMPurify from "isomorphic-dompurify";

const ALLOWED_TAGS = [
  "p", "br", "hr", "h1", "h2", "h3", "h4", "h5", "h6",
  "ul", "ol", "li", "blockquote", "pre", "code",
  "strong", "em", "b", "i", "u", "s", "a",
  "img", "figure", "figcaption", "span", "div", "section", "article",
];

const ALLOWED_ATTR = ["href", "src", "alt", "title", "target", "rel", "class"];

/** Kullanıcı/AI üretimi HTML'i güvenli bir alt kümeye indirger. */
export function sanitizeHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    // javascript:, data: gibi tehlikeli şemaları engelle (http/https/mailto/tel hariç).
    ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto|tel):|[^a-z]|[a-z+.-]+(?:[^a-z+.:-]|$))/i,
    FORBID_TAGS: ["script", "style", "iframe", "object", "embed", "form"],
    FORBID_ATTR: ["onerror", "onload", "onclick", "style"],
  });
}
