/**
 * Encodes the background video for the web.
 *
 * The source is 4K, 20 seconds, 27 Mbps, 68MB. That is a fine master and an
 * unusable web asset: shipping it would cost more than every other byte on the
 * page combined. This produces what a background loop actually needs.
 *
 *   A single 1920 wide MP4. A VP9 WebM was tried and came out slightly LARGER
 *   than h264 on this footage, which is abstract, near-black and low in
 *   detail, so shipping both would mean serving a bigger file to the browsers
 *   that prefer WebM. One format, universally supported.
 *   No audio track. It is a background; audio would only be dead weight.
 *   faststart, so the moov atom is at the front and playback can begin before
 *   the whole file has arrived.
 *   A poster frame, so the section is never empty while the video loads and
 *   still looks right for anyone who blocks video or is on a metered
 *   connection.
 *
 * Quality is set by CRF rather than a bitrate target: the footage is abstract
 * and near-black, so it compresses far better than a fixed bitrate assumes.
 *
 * Usage: node scripts/encode-video.mjs
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, statSync } from "node:fs";
import ffmpeg from "ffmpeg-static";

const SRC = "background video.mp4";
const OUT = "public/video";

if (!existsSync(SRC)) {
  console.error(`Source not found: ${SRC}`);
  process.exit(1);
}
mkdirSync(OUT, { recursive: true });

const kb = (p) => `${Math.round(statSync(p).size / 1024)}kb`;

function run(args, label) {
  process.stdout.write(`  ${label} ... `);
  execFileSync(ffmpeg, ["-hide_banner", "-loglevel", "error", "-y", ...args], {
    stdio: ["ignore", "ignore", "inherit"],
  });
  console.log("done");
}

// A background behind a scrim does not need 1080p worth of detail, but 1920
// keeps it crisp on a large display without costing much on this footage.
const SCALE = "scale=1920:-2";

run(
  [
    "-i", SRC,
    "-an",
    "-vf", SCALE,
    "-c:v", "libx264",
    "-profile:v", "high",
    "-crf", "33",
    "-preset", "slow",
    "-pix_fmt", "yuv420p",
    "-movflags", "+faststart",
    `${OUT}/signal.mp4`,
  ],
  "mp4 (h264)",
);

run(
  [
    "-i", SRC,
    "-vf", "scale=1600:-2",
    "-frames:v", "1",
    "-ss", "00:00:04",
    "-q:v", "6",
    `${OUT}/signal-poster.jpg`,
  ],
  "poster frame",
);

console.log("\nEncoded:");
for (const f of ["signal.mp4", "signal-poster.jpg"]) {
  console.log(`  ${f.padEnd(22)} ${kb(`${OUT}/${f}`)}`);
}
console.log(`  source was ${kb(SRC)}`);
