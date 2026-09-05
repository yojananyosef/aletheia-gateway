import fs from 'fs';
import path from 'path';
import { AVAILABLE_TRANSLATIONS } from '../src/modules/bible-reader/domain/entities/Translation';

const biblesDir = path.resolve('public/data/bibles');
const allEntries = [];

for (const [id, info] of Object.entries(AVAILABLE_TRANSLATIONS)) {
  const versionDir = path.join(biblesDir, id);
  let booksCount = 0;
  let chaptersCount = 0;

  if (fs.existsSync(versionDir)) {
    const files = fs.readdirSync(versionDir).filter((f: string) => f.endsWith('.json'));
    booksCount = files.length;
    for (const file of files) {
      try {
        const content = JSON.parse(fs.readFileSync(path.join(versionDir, file), 'utf-8'));
        if (content.chapters) {
          chaptersCount += Object.keys(content.chapters).length;
        }
      } catch (err) {
        console.error(`Error reading ${file} in ${id}:`, err);
      }
    }
  }

  allEntries.push({
    id: info.id,
    name: info.name,
    shortName: info.shortName,
    description: info.description || '',
    language: info.language,
    languageName: info.languageName || info.language,
    flag: info.flag || '',
    direction: info.direction || 'ltr',
    copyright: info.copyright || 'Dominio Público',
    booksCount,
    chaptersCount,
  });
}

const manifestPath = path.join(biblesDir, 'manifest.json');
fs.writeFileSync(manifestPath, JSON.stringify(allEntries, null, 2), 'utf-8');
console.log(`✅ Manifiesto generado con ${allEntries.length} versiones en ${manifestPath}`);
