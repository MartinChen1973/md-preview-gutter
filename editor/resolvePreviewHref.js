const path = require('path');

const FILE_SCHEME = 'file:';
const SCHEME_RE = /^[a-z][a-z0-9+.-]*:/i;
const LINE_FRAGMENT_RE = /^L(\d+)$/i;
const HASH = '#';
const DOT_SLASH = './';
const SLASH = '/';
const DOT_SEGMENT = '.';
const DRIVE_PREFIX_RE = /^\/[a-zA-Z]:/;
const HREF_ATTR_RE = /href="([^"]*)"/g;
const FILE_URI_PREFIX = 'file://';
const DEFAULT_LINE = 1;

function resolvePreviewHref(documentFsPath, href) {
  if (!href || href.charAt(0) === HASH) {
    return undefined;
  }
  const parts = splitHash(href);
  if (isExternalHref(parts.path)) {
    return { external: href };
  }
  return {
    fsPath: siblingFsPath(documentFsPath, parts.path),
    line: lineFromFragment(parts.fragment),
  };
}

function siblingFsPath(documentFsPath, rawPath) {
  return path.resolve(path.dirname(documentFsPath), relativePath(rawPath));
}

function rewriteRelativeHrefs(html, documentFsPath) {
  return html.replace(HREF_ATTR_RE, (_all, href) => hrefAttribute(documentFsPath, href));
}

function hrefAttribute(documentFsPath, href) {
  const resolved = resolvePreviewHref(documentFsPath, href);
  if (!resolved || resolved.external) {
    return `href="${href}"`;
  }
  const target = fileHref(resolved);
  return `href="${target}" data-memo-href="${target}"`;
}

function fileHref(resolved) {
  const uri = toFileUri(resolved.fsPath);
  if (resolved.line === undefined) {
    return uri;
  }
  return `${uri}${HASH}L${resolved.line}`;
}

function toFileUri(fsPath) {
  const slash = fsPath.replace(/\\/g, SLASH);
  const body = slash.startsWith(SLASH) ? slash : `${SLASH}${slash}`;
  return `${FILE_URI_PREFIX}${encodeURI(body)}`;
}

function relativePath(rawPath) {
  if (!startsWithFile(rawPath)) {
    return stripDotSlash(rawPath);
  }
  const pathname = filePathname(rawPath);
  if (isRootFilename(pathname)) {
    return path.posix.basename(stripDotSlash(pathname));
  }
  return windowsFsPath(pathname);
}

function isExternalHref(rawPath) {
  return SCHEME_RE.test(rawPath) && !startsWithFile(rawPath);
}

function startsWithFile(rawPath) {
  return rawPath.toLowerCase().startsWith(FILE_SCHEME);
}

function splitHash(href) {
  const index = href.indexOf(HASH);
  if (index < 0) {
    return { path: href, fragment: '' };
  }
  return { path: href.slice(0, index), fragment: href.slice(index + 1) };
}

function stripDotSlash(value) {
  if (value.startsWith(DOT_SLASH)) {
    return value.slice(DOT_SLASH.length);
  }
  return value;
}

function lineFromFragment(fragment) {
  const match = fragment ? LINE_FRAGMENT_RE.exec(fragment) : null;
  return match ? Number(match[1]) : undefined;
}

function filePathname(rawPath) {
  const body = splitHash(rawPath).path.slice(FILE_SCHEME.length);
  if (!body.startsWith('//')) {
    return decodeURIComponent(body);
  }
  const hostEnd = body.indexOf(SLASH, 2);
  if (hostEnd < 0) {
    return SLASH;
  }
  return decodeURIComponent(body.slice(hostEnd));
}

function isRootFilename(pathname) {
  const parts = pathname.split(SLASH).filter((part) => part.length > 0);
  if (parts.length === 1) {
    return true;
  }
  return parts.length === 2 && parts[0] === DOT_SEGMENT;
}

function windowsFsPath(pathname) {
  if (DRIVE_PREFIX_RE.test(pathname)) {
    return pathname.slice(1);
  }
  return pathname;
}

function openLine(resolved) {
  return resolved.line === undefined ? DEFAULT_LINE : resolved.line;
}

module.exports = {
  resolvePreviewHref,
  siblingFsPath,
  rewriteRelativeHrefs,
  openLine,
};
