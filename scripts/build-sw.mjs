// Lager out/sw.js fra scripts/sw.template.js, med liste over alt som skal forhåndslastes og en
// versjon utledet fra innholdet. Kjøres av `postbuild`. Uten ny versjon ville ikke nettleseren
// oppdaget at innholdet er endret.
import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const out = join(root, "out");

if (!existsSync(out)) {
    throw new Error("out/ finnes ikke. Kjør `next build` først.");
}

const walk = (dir) =>
    readdirSync(dir).flatMap((name) => {
        const path = join(dir, name);
        return statSync(path).isDirectory() ? walk(path) : [path];
    });

const files = walk(out)
    .map((path) => relative(out, path).split(sep).join("/"))
    .sort();

// Fonter som stilarkene faktisk bruker forhåndslastes. Resten (andre merkevarer) caches
// første gang de brukes, så vi ikke laster ned titalls MB som aldri vises.
const css = files
    .filter((file) => file.endsWith(".css"))
    .map((file) => readFileSync(join(out, file), "utf8"))
    .join("\n");
const usedFonts = new Set([...css.matchAll(/url\(["']?(\/fonts\/[^"')?#]+)/g)].map((m) => m[1]));

const skip = (file) =>
    file === "sw.js" ||
    file === "CNAME" ||
    file.endsWith(".map") ||
    (file.startsWith("fonts/") && !usedFonts.has(`/${file}`));

const kept = files.filter((file) => !skip(file));

// Pene URL-er: /quiz/1/index.html nås som /quiz/1/, og /index.html som /. Bare den ene formen
// lagres, så ingenting forhåndslastes to ganger.
// encodeURI: Next ber om `%5Bstep%5D`, ikke `[step]`, og cachen matcher på eksakt URL.
const toUrl = (file) =>
    encodeURI(file.endsWith("index.html") ? `/${file.slice(0, -"index.html".length)}` : `/${file}`);
const urls = kept.map(toUrl);

const template = readFileSync(join(root, "scripts", "sw.template.js"), "utf8");

const hash = createHash("sha256");
hash.update(template);
hash.update(JSON.stringify(urls));
for (const file of kept) {
    hash.update(file);
    hash.update(readFileSync(join(out, file)));
}
const version = hash.digest("hex").slice(0, 12);

writeFileSync(
    join(out, "sw.js"),
    template.replace("__VERSION__", version).replace('"__PRECACHE__"', JSON.stringify(urls)),
);

console.log(`sw.js: versjon ${version}, ${urls.length} URL-er forhåndslastes`);
