#!/usr/bin/env bash
# hls-local.sh — Download HLS or direct-video streams from M3U8 Detector JSON
# Saves MP4 files to ~/Downloads (or a directory you choose).
# Requires: curl, ffmpeg, python3

set -euo pipefail
IFS=$'\n\t'

# ── Colors ────────────────────────────────────────────────────────────────────
C_RED='\033[0;31m'; C_GRN='\033[0;32m'; C_YLW='\033[0;33m'
C_BLU='\033[0;34m'; C_GRY='\033[0;90m'; C_RST='\033[0m'; C_BLD='\033[1m'

info()    { echo -e "${C_BLU}▸${C_RST} $*"; }
ok()      { echo -e "${C_GRN}✓${C_RST} $*"; }
warn()    { echo -e "${C_YLW}⚠${C_RST} $*"; }
err()     { echo -e "${C_RED}✗${C_RST} $*" >&2; }
ask()     { echo -en "${C_BLD}$*${C_RST} "; }
section() { echo -e "\n${C_GRY}────────────────────────────────────────${C_RST}\n${C_BLD}$*${C_RST}"; }

# ── Dependency check ──────────────────────────────────────────────────────────
missing=()
for cmd in curl ffmpeg python3; do
  command -v "$cmd" &>/dev/null || missing+=("$cmd")
done
if [[ ${#missing[@]} -gt 0 ]]; then
  err "Missing required tools: ${missing[*]}"
  echo "  Install with:  brew install ${missing[*]}"
  exit 1
fi

echo -e "\n${C_BLD}M3U8 Detector — Local Downloader${C_RST}  ${C_GRY}(hls-local.sh)${C_RST}"
echo -e "${C_GRY}Downloads HLS and direct-video streams to a local folder.${C_RST}"

# ── JSON input ────────────────────────────────────────────────────────────────
section "1 / 3  —  Load streams"

JSON_FILE="${1:-}"
if [[ -z "$JSON_FILE" ]]; then
  ask "Path to m3u8_*.json exported by the extension:"
  read -r JSON_FILE
  JSON_FILE="${JSON_FILE/#\~/$HOME}"
fi

if [[ ! -f "$JSON_FILE" ]]; then
  err "File not found: $JSON_FILE"
  exit 1
fi

# Parse JSON with python3 — emit tab-separated: name\turl\ttype\tseg_count\tseg_json
STREAM_DATA=$(python3 - "$JSON_FILE" <<'PYEOF'
import json, sys

with open(sys.argv[1]) as f:
    entries = json.load(f)

if not isinstance(entries, list) or not entries:
    sys.exit(0)

for e in entries:
    segs        = e.get("segments") or []
    url         = e.get("streamUrl") or ""
    stream_type = e.get("streamType") or (
        "direct" if not segs and url.lower().split("?")[0].endswith((".mp4", ".mkv", ".webm"))
        else "hls"
    )
    name = (
        e.get("customName") or e.get("name") or e.get("pageTitle") or
        url.split("/")[-1].split("?")[0] or "stream"
    ).strip()
    seg_json = json.dumps(segs)
    print(f"{name}\t{url}\t{stream_type}\t{len(segs)}\t{seg_json}")
PYEOF
)

if [[ -z "$STREAM_DATA" ]]; then
  err "No streams found in $JSON_FILE"
  exit 1
fi

STREAM_COUNT=$(echo "$STREAM_DATA" | wc -l | tr -d ' ')
info "Found $STREAM_COUNT stream(s):"

i=0
while IFS=$'\t' read -r name url stype seg_count _segs; do
  i=$((i + 1))
  tag="[HLS]"; [[ "$stype" == "direct" ]] && tag="[MP4]"
  echo -e "  ${C_GRY}$i.${C_RST}  ${C_YLW}$tag${C_RST}  ${C_BLD}$name${C_RST}"
  echo -e "       ${C_GRY}$url${C_RST}"
  [[ "$stype" == "hls" && "$seg_count" -gt 0 ]] && \
    echo -e "       ${C_GRN}$seg_count segments pre-fetched${C_RST}"
done <<< "$STREAM_DATA"

# ── Settings ──────────────────────────────────────────────────────────────────
section "2 / 3  —  Settings"

DEFAULT_OUT="$HOME/Downloads"
ask "Output directory [${DEFAULT_OUT}]:"
read -r OUT_DIR
OUT_DIR="${OUT_DIR:-$DEFAULT_OUT}"
OUT_DIR="${OUT_DIR/#\~/$HOME}"
mkdir -p "$OUT_DIR"
ok "Output: $OUT_DIR"

ask "Parallel workers for HLS segment downloads [15]:"
read -r WORKERS
WORKERS="${WORKERS:-15}"

# ── Download helpers ──────────────────────────────────────────────────────────
WORK_ROOT="$(mktemp -d)"
trap 'rm -rf "$WORK_ROOT"' EXIT

safe_name() {
  echo "$1" | tr ' /:*?"<>|\\' '_' | cut -c1-60
}

download_hls() {
  local name="$1" url="$2" seg_json="$3"
  local sname; sname=$(safe_name "$name")
  local out_mp4="$OUT_DIR/${sname}.mp4"
  local workdir="$WORK_ROOT/${sname}"

  if [[ -f "$out_mp4" ]]; then
    warn "$name — already exists, skipping"
    return 0
  fi

  mkdir -p "$workdir"

  # Write pre-fetched segments (or fetch playlist if none)
  local seg_file="$workdir/segments.txt"
  python3 -c "
import json, sys
segs = json.loads(sys.argv[1])
for s in segs:
    print(s)
" "$seg_json" > "$seg_file"

  local total; total=$(wc -l < "$seg_file" | tr -d ' ')

  if [[ "$total" -eq 0 ]]; then
    info "  Fetching playlist: $url"
    local base; base="${url%/*}/"
    # Detect and follow master playlist
    local playlist; playlist=$(curl -sfL \
      -H "User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/125.0.0.0 Safari/537.36" \
      "$url")

    if echo "$playlist" | grep -q '#EXT-X-STREAM-INF'; then
      local best_url; best_url=$(python3 - "$url" <<'PYEOF'
import sys, re, subprocess
url = sys.argv[1]
base = url.rsplit("/", 1)[0] + "/"
pl = subprocess.check_output(["curl", "-sfL", url]).decode()
lines = pl.splitlines()
variants = []
for i, l in enumerate(lines):
    if l.startswith("#EXT-X-STREAM-INF"):
        m = re.search(r"BANDWIDTH=(\d+)", l)
        bw = int(m.group(1)) if m else 0
        uri = lines[i+1].strip() if i+1 < len(lines) else ""
        if uri and not uri.startswith("http"):
            uri = base + uri
        variants.append((bw, uri))
variants.sort(reverse=True)
print(variants[0][1] if variants else "")
PYEOF
      )
      [[ -n "$best_url" ]] && url="$best_url" && base="${url%/*}/"
      playlist=$(curl -sfL "$url")
    fi

    echo "$playlist" | grep -v '^#' | grep -v '^$' | while IFS= read -r seg; do
      [[ "$seg" == http* ]] || seg="${base}${seg}"
      echo "$seg"
    done > "$seg_file"
    total=$(wc -l < "$seg_file" | tr -d ' ')
  fi

  info "  Downloading $total segments (workers: $WORKERS)…"

  # Parallel curl via xargs
  local idx=0
  while IFS= read -r seg_url; do
    idx=$((idx + 1))
    printf '%04d\t%s\n' "$idx" "$seg_url"
  done < "$seg_file" | \
  xargs -P "$WORKERS" -L 1 bash -c '
    n="${1%%	*}"; u="${1#*	}"
    out="'"$workdir"'/seg-${n}.ts"
    [[ -f "$out" ]] && exit 0
    curl -sfL --retry 3 --retry-delay 1 \
      -H "User-Agent: Mozilla/5.0" \
      -o "$out" "$u" || echo "FAIL: $u" >&2
  ' _

  # Combine segments, strip PNG wrapper (TikTok CDN)
  info "  Combining segments…"
  local combined="$workdir/combined.ts"
  python3 - "$workdir" "$combined" <<'PYEOF'
import os, glob, sys
workdir, combined = sys.argv[1], sys.argv[2]
IEND = b'IEND\xaeB\x60\x82'
PNG_MAGIC = b'\x89PNG'

segs = sorted(
    glob.glob(f"{workdir}/seg-*.ts"),
    key=lambda p: int(os.path.basename(p).replace("seg-", "").replace(".ts", ""))
)
if not segs:
    print("  No segments found!")
    sys.exit(1)

has_png = open(segs[0], "rb").read(4) == PNG_MAGIC
if has_png:
    print("  PNG wrapper detected (TikTok CDN) — stripping…")

with open(combined, "wb") as out:
    for path in segs:
        data = open(path, "rb").read()
        if has_png:
            pos = data.find(IEND)
            if pos != -1:
                data = data[pos + len(IEND):]
        out.write(data)
print(f"  Combined {len(segs)} segments")
PYEOF

  info "  Muxing → ${sname}.mp4"
  ffmpeg -y -loglevel error \
    -i "$combined" -c copy -bsf:a aac_adtstoasc \
    "$out_mp4"

  local size; size=$(du -sh "$out_mp4" | cut -f1)
  ok "$name — $size → $out_mp4"
  rm -rf "$workdir"
}

download_direct() {
  local name="$1" url="$2"
  local sname; sname=$(safe_name "$name")
  local ext="mp4"
  local clean="${url%%\?*}"; clean="${clean%%\#*}"
  [[ "$clean" == *.mkv ]] && ext="mkv"
  [[ "$clean" == *.webm ]] && ext="webm"
  local out_file="$OUT_DIR/${sname}.${ext}"

  if [[ -f "$out_file" ]]; then
    warn "$name — already exists, skipping"
    return 0
  fi

  info "  Downloading direct video…"
  local referer; referer=$(python3 -c "
from urllib.parse import urlparse
u = urlparse('$url')
print(f'{u.scheme}://{u.netloc}')
")
  curl -L --progress-bar --retry 3 \
    -H "User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/125.0.0.0 Safari/537.36" \
    -H "Referer: $referer" \
    -o "$out_file" "$url"

  local size; size=$(du -sh "$out_file" | cut -f1)
  ok "$name — $size → $out_file"
}

# ── Main loop ─────────────────────────────────────────────────────────────────
section "3 / 3  —  Downloading"

ERRORS=0
idx=0
while IFS=$'\t' read -r name url stype _seg_count seg_json; do
  idx=$((idx + 1))
  tag="HLS"; [[ "$stype" == "direct" ]] && tag="MP4"
  echo -e "\n${C_GRY}[$idx/$STREAM_COUNT]${C_RST} ${C_BLD}$name${C_RST}  ${C_GRY}($tag)${C_RST}"

  ask "  Rename? Leave blank to keep '${name}':"
  read -r new_name </dev/tty
  [[ -n "$new_name" ]] && name="$new_name"

  ask "  Skip? [y/N]:"
  read -r skip </dev/tty
  [[ "${skip,,}" == "y" ]] && { warn "  Skipped."; continue; }

  if [[ "$stype" == "direct" ]]; then
    download_direct "$name" "$url" || { err "Failed: $name"; ERRORS=$((ERRORS + 1)); }
  else
    download_hls "$name" "$url" "$seg_json" || { err "Failed: $name"; ERRORS=$((ERRORS + 1)); }
  fi
done <<< "$STREAM_DATA"

echo ""
if [[ $ERRORS -eq 0 ]]; then
  ok "All done. Files in: $OUT_DIR"
else
  warn "Done with $ERRORS error(s)."
fi
