#!/usr/bin/env python3
"""
Mirror https://sit.iitd.ac.in/ for content migration.

Standard library only (Python 3.8+). Run:
    python sit_scrape.py
Creates ./sit_scrape/ (raw HTML, assets, manifest.json) and ./sit_scrape.zip.

What it collects
  * every HTML page on sit.iitd.ac.in reachable by links (BFS)
  * every image / icon / stylesheet / font / PDF / doc referenced by those pages,
    from any host (assets only -- HTML on other hosts is NOT crawled)
  * url(...) and @import references inside CSS files and inline style attributes
  * manifest.json: url -> local file, status, content-type, title, outgoing links
"""
import json, os, re, ssl, sys, time, zipfile, hashlib, gzip, zlib
from collections import deque
from html.parser import HTMLParser
from urllib.parse import urljoin, urlparse, urlunparse, unquote, quote
from urllib.request import Request, urlopen
from urllib.error import HTTPError, URLError

START = ["https://sit.iitd.ac.in/"]
SEEDS = [
    "/", "/frontend/vision", "/people", "/faculty", "/students", "/alumni",
    "/researchstaff", "/adminstaff", "/research", "/phd", "/msr", "/mtechcs",
    "/admission", "/how", "/contact",
] + [f"/show-news/{i}" for i in range(1, 120)]   # probe numbered content pages too
CRAWL_HOSTS = {"sit.iitd.ac.in", "www.sit.iitd.ac.in"}
SKIP_PATTERNS = re.compile(r"(logout|login|signin|webmail|/admin\b|wp-admin|mailto:|tel:|javascript:)", re.I)
MAX_PAGES = 3000
MAX_ASSET_BYTES = 80 * 1024 * 1024
DELAY = 0.25
OUT = os.path.abspath("sit_scrape")
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) SIT-content-migration/1.0"

ASSET_EXT = re.compile(r"\.(png|jpe?g|gif|svg|webp|ico|bmp|tiff?|css|woff2?|ttf|otf|eot|pdf|docx?|xlsx?|pptx?|zip|mp4|webm|mp3)(\?|$)", re.I)

ctx_verified = ssl.create_default_context()
ctx_unverified = ssl._create_unverified_context()
insecure_hosts = set()


def norm(url):
    p = urlparse(url)
    if p.scheme not in ("http", "https"):
        return None
    host = p.netloc.lower()
    path = p.path or "/"
    path = quote(unquote(path), safe="/%:@&=+$,;~!*'()")
    scheme = "https" if host in CRAWL_HOSTS else p.scheme
    return urlunparse((scheme, host, path, "", p.query, ""))


def fetch(url):
    host = urlparse(url).netloc
    req = Request(url, headers={"User-Agent": UA, "Accept": "*/*", "Accept-Encoding": "gzip, deflate"})
    for attempt in range(3):
        try:
            ctx = ctx_unverified if host in insecure_hosts else ctx_verified
            with urlopen(req, timeout=40, context=ctx) as r:
                data = r.read(MAX_ASSET_BYTES + 1)
                enc = (r.headers.get("Content-Encoding") or "").lower()
                if enc == "gzip":
                    data = gzip.decompress(data)
                elif enc == "deflate":
                    data = zlib.decompress(data)
                return r.status, r.headers.get("Content-Type", ""), data, r.geturl()
        except ssl.SSLError as e:
            if host not in insecure_hosts:
                print(f"  ! SSL problem on {host} ({e}); retrying without cert verification")
                insecure_hosts.add(host)
                continue
            raise
        except URLError as e:
            if isinstance(getattr(e, "reason", None), ssl.SSLError) and host not in insecure_hosts:
                print(f"  ! SSL problem on {host}; retrying without cert verification")
                insecure_hosts.add(host)
                continue
            if isinstance(e, HTTPError):
                return e.code, e.headers.get("Content-Type", "") if e.headers else "", b"", url
            if attempt == 2:
                raise
            time.sleep(2)
    return 0, "", b"", url


def local_path(url, ctype):
    p = urlparse(url)
    path = unquote(p.path)
    if path.endswith("/") or path == "":
        path += "index"
    path = re.sub(r'[<>:"\\|?*]', "_", path)          # Windows-safe
    parts = [seg[:120] for seg in path.strip("/").split("/") if seg not in ("", ".", "..")]
    is_html = "html" in ctype
    base = os.path.join("pages" if is_html else "assets", p.netloc, *parts)
    if p.query:
        base += "__" + hashlib.md5(p.query.encode()).hexdigest()[:8]
    if is_html and not base.endswith(".html"):
        base += ".html"
    return base


class Extract(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.links, self.assets, self.title, self._in_title = [], [], "", False
        self.inline_css = []

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag == "title":
            self._in_title = True
        if tag in ("a", "area") and a.get("href"):
            self.links.append(a["href"])
        if tag in ("img", "source", "video", "audio", "embed", "input", "track"):
            for k in ("src", "data-src", "data-original", "data-lazy-src", "poster", "data-bg", "data-background"):
                if a.get(k):
                    self.assets.append(a[k])
            for k in ("srcset", "data-srcset"):
                if a.get(k):
                    self.assets += [s.strip().split(" ")[0] for s in a[k].split(",") if s.strip()]
        if tag == "link" and a.get("href"):
            rel = (a.get("rel") or "").lower()
            if any(x in rel for x in ("stylesheet", "icon", "apple-touch", "preload", "manifest", "image_src")):
                self.assets.append(a["href"])
        if tag == "meta" and a.get("content") and (a.get("property", "") + a.get("name", "")).lower() in (
                "og:image", "twitter:image", "msapplication-tileimage"):
            self.assets.append(a["content"])
        if tag in ("iframe", "frame") and a.get("src"):
            self.links.append(a["src"])
        if tag == "object" and a.get("data"):
            self.assets.append(a["data"])
        for k in ("data-bg", "data-background", "data-image", "data-src"):
            if a.get(k) and tag not in ("img",):
                self.assets.append(a[k])
        if a.get("style"):
            self.inline_css.append(a["style"])

    def handle_endtag(self, tag):
        if tag == "title":
            self._in_title = False

    def handle_data(self, d):
        if self._in_title:
            self.title += d


CSS_URL = re.compile(r"url\(\s*['\"]?([^'\")]+)['\"]?\s*\)", re.I)
CSS_IMPORT = re.compile(r"@import\s+['\"]([^'\"]+)['\"]", re.I)
STYLE_BLOCK = re.compile(r"<style[^>]*>(.*?)</style>", re.I | re.S)


def css_refs(text):
    refs = CSS_URL.findall(text) + CSS_IMPORT.findall(text)
    return [r for r in refs if not r.startswith("data:")]


def main():
    os.makedirs(OUT, exist_ok=True)
    manifest = {}
    queue = deque()
    seen = set()

    def enqueue(u, kind, base):
        if not u or SKIP_PATTERNS.search(u) or u.startswith("data:") or u.startswith("#"):
            return
        full = norm(urljoin(base, u.strip()))
        if not full or full in seen:
            return
        host = urlparse(full).netloc
        if kind == "page" and host not in CRAWL_HOSTS:
            # external page: record only, unless it is obviously a file
            if ASSET_EXT.search(urlparse(full).path):
                kind = "asset"
            else:
                manifest.setdefault(full, {"kind": "external-link", "url": full})
                return
        seen.add(full)
        queue.append((full, kind))

    for s in SEEDS:
        enqueue(s, "page", START[0])

    pages = 0
    while queue:
        url, kind = queue.popleft()
        if kind == "page" and pages >= MAX_PAGES:
            continue
        try:
            status, ctype, data, final = fetch(url)
        except Exception as e:
            print(f"ERR  {url}: {e}")
            manifest[url] = {"kind": kind, "url": url, "error": str(e)}
            continue
        time.sleep(DELAY)
        entry = {"kind": kind, "url": url, "final_url": final, "status": status, "content_type": ctype,
                 "bytes": len(data)}
        if status != 200 or not data:
            print(f"{status}  {url}")
            manifest[url] = entry
            continue
        ctype_l = ctype.lower()
        is_html = "html" in ctype_l or (kind == "page" and data[:200].lstrip().lower().startswith((b"<!doctype", b"<html")))
        if is_html:
            ctype_l = "text/html"
        rel = local_path(url, ctype_l)
        dest = os.path.join(OUT, rel)
        os.makedirs(os.path.dirname(dest), exist_ok=True)
        with open(dest, "wb") as f:
            f.write(data)
        entry["file"] = rel.replace("\\", "/")

        if is_html:
            pages += 1
            text = data.decode("utf-8", errors="replace")
            ex = Extract()
            try:
                ex.feed(text)
            except Exception as e:
                print(f"  parse warning {url}: {e}")
            entry["title"] = ex.title.strip()
            base = final or url
            for l in ex.links:
                enqueue(l, "page", base)
            for a in ex.assets:
                enqueue(a, "asset", base)
            for blob in ex.inline_css + STYLE_BLOCK.findall(text):
                for r in css_refs(blob):
                    enqueue(r, "asset", base)
            entry["links"] = sorted({norm(urljoin(base, l)) or l for l in ex.links})
            entry["assets"] = sorted({norm(urljoin(base, a)) or a for a in ex.assets})
            print(f"PAGE {pages:4d} {url}  [{entry['title'][:50]}]")
        else:
            if "css" in ctype_l or rel.lower().endswith(".css"):
                for r in css_refs(data.decode("utf-8", errors="replace")):
                    enqueue(r, "asset", url)
            print(f"FILE {url}  ({len(data)//1024} KB)")
        manifest[url] = entry

    with open(os.path.join(OUT, "manifest.json"), "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=1, ensure_ascii=False)

    zpath = OUT + ".zip"
    with zipfile.ZipFile(zpath, "w", zipfile.ZIP_DEFLATED) as z:
        for root, _, files in os.walk(OUT):
            for fn in files:
                full = os.path.join(root, fn)
                z.write(full, os.path.relpath(full, os.path.dirname(OUT)))
    n_assets = sum(1 for v in manifest.values() if v.get("kind") == "asset" and v.get("file"))
    print(f"\nDone: {pages} pages, {n_assets} assets. Archive: {zpath} "
          f"({os.path.getsize(zpath)//(1024*1024)} MB)")


if __name__ == "__main__":
    main()
