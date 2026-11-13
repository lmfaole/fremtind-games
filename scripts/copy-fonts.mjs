import { cp, mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const source = join(root, "node_modules", "@fremtind", "jokul", "src", "fonts");
const target = join(root, "public", "fonts");

await mkdir(target, { recursive: true });
await cp(source, target, { recursive: true });
