import fs from 'fs';
import path from 'path';

function findReactErrors(dirPath, regex, foundErrors) {
  const files = fs.readdirSync(dirPath);
  for (const file of files) {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      findReactErrors(fullPath, regex, foundErrors);
    } else if (file.endsWith('.jsx') || file.endsWith('.js')) {
      const content = fs.readFileSync(fullPath, 'utf-8');
      let match;
      while ((match = regex.exec(content)) !== null) {
        foundErrors.push({ file: fullPath, line: match[0], index: match.index });
      }
    }
  }
}

const frontendSrc = path.join(process.cwd(), 'frontend', 'src');
const errors = [];
const importRegex = /import\s+.*?from\s+['"].*?['"]/g;

findReactErrors(frontendSrc, importRegex, errors);

console.log(`Found ${errors.length} imports`);
