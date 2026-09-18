#!/bin/bash
# Download the video referenced in an m3u8-detector JSON export.
#
# NOTE: despite streamType:"hls" and a large segmentCount, Tubi's captured
# "segments" here are all the SAME url repeated (one per HTTP range-request
# during playback) — this is a single progressive .mp4, not real HLS chunks.
# So: dedupe the url, one resumable curl download. No concat, no parallel
# fan-out, nothing held in memory beyond curl's own buffer.
#
# Usage: ./dl-tubi.sh m3.json [mv1.json mv2.json ...]

set -euo pipefail
UA="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/125.0.0.0 Safari/537.36"
OUT_DIR="$(pwd)/downloads"
mkdir -p "$OUT_DIR"

for JSON in "$@"; do
  TITLE=$(python3 -c "
import json, re
d = json.load(open('$JSON'))[0]
name = d.get('customName') or d.get('name') or '$JSON'
print(re.sub(r'[^A-Za-z0-9 ._()-]', '_', name).strip())
")
  COOKIE=$(python3 -c "import json; print(json.load(open('$JSON'))[0].get('cookies') or '')")
  URL=$(python3 -c "
import json
segs = json.load(open('$JSON'))[0]['segments']
uniq = set(segs)
if len(uniq) != 1:
    raise SystemExit(f'expected 1 unique segment url, got {len(uniq)} — this file is NOT a simple duplicated-url case, stop and inspect it')
print(segs[0])
")

  OUT="$OUT_DIR/${TITLE}.mp4"
  echo "[$TITLE] -> $OUT"
  curl -L --retry 5 --retry-delay 2 -C - \
    -H "User-Agent: $UA" -H "Cookie: $COOKIE" \
    -o "$OUT" "$URL"
  echo "[$TITLE] done: $(du -h "$OUT" | cut -f1)"
  echo
done
