/**
 * Downloads the site's photography from Pexels into public/photos/.
 *
 * Every image here is under the Pexels License, which permits free use
 * including commercially, with no attribution required. The IDs are pinned so
 * the set is reproducible and nobody has to go hunting for "that photo" again.
 *
 * Re-run after changing the list: node scripts/fetch-photos.mjs
 */
import { writeFileSync, mkdirSync, existsSync } from "node:fs";

const OUT = "public/photos";

/** [filename, pexels id, width, what it shows] */
const PHOTOS = [
  ["on-the-phone", 6964143, 1600, "Close-up of a woman speaking on a mobile phone, low warm light"],
  ["owner-desk", 5922401, 1600, "A business owner working late at a desk, dark room"],
  ["shop-owner", 8475171, 1200, "A small business owner in an apron at the shop door"],
  ["dental-operatory", 7800666, 1200, "A patient in the dental chair while two dentists work beside her"],
  ["salon-chair", 5368632, 1200, "A stylist working on a client in a salon"],
  ["field-technician", 8486978, 1200, "A technician in a high-visibility vest on a job"],
  ["clinic-consult", 8460095, 1200, "A doctor in a white coat talking with a patient across his desk"],
  ["team-office", 8117465, 1200, "Four people leaning over papers on a shared office table"],
  ["tour-group", 31711202, 1400, "Passengers on an open-top sightseeing bus, one reading a map"],
  ["attraction-hall", 2559741, 1200, "Visitors walking through a bright gallery"],
];

mkdirSync(OUT, { recursive: true });

let got = 0;
for (const [name, id, width, alt] of PHOTOS) {
  const path = `${OUT}/${name}.jpg`;
  if (existsSync(path) && !process.argv.includes("--force")) {
    console.log(`  ${name}.jpg already present`);
    got++;
    continue;
  }
  const url = `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=${width}`;
  try {
    const r = await fetch(url);
    if (!r.ok) {
      console.log(`  ${name} HTTP ${r.status}`);
      continue;
    }
    const buf = Buffer.from(await r.arrayBuffer());
    writeFileSync(path, buf);
    console.log(`  ${name}.jpg  ${Math.round(buf.length / 1024)}kb  ${alt}`);
    got++;
  } catch (e) {
    console.log(`  ${name} FAILED ${e.message.slice(0, 60)}`);
  }
}

console.log(`\n${got}/${PHOTOS.length} photos in ${OUT}/`);
