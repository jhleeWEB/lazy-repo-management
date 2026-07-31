import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const languageTags = {
  en: "en",
  es: "es",
  ja: "ja",
  pt: "pt-BR",
  zh: "zh-CN",
  ru: "ru",
  fr: "fr",
  de: "de",
};

await Promise.all(
  Object.entries(languageTags).map(async ([path, language]) => {
    const file = join(process.cwd(), "out", path, "index.html");
    const html = await readFile(file, "utf8");
    const localized = html.replace('<html lang="ko"', `<html lang="${language}"`);
    if (localized === html) {
      throw new Error(`Could not set the HTML language for ${file}`);
    }
    await writeFile(file, localized, "utf8");
  }),
);