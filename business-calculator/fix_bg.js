const fs = require('fs');
const path = require('path');

const dir = 'app/calculators';

function walk(directory) {
  let results = [];
  try {
    const list = fs.readdirSync(directory);
    list.forEach((file) => {
      file = path.join(directory, file);
      const stat = fs.statSync(file);
      if (stat && stat.isDirectory()) {
        results = results.concat(walk(file));
      } else {
        if (file.endsWith('.tsx')) {
          results.push(file);
        }
      }
    });
  } catch(e) {}
  return results;
}

const files = walk(dir);

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  // Make sure bg-white exists before dark:bg-white/5
  content = content.replace(/(^|[^a-zA-Z0-9:-])bg-white\/5(?!\/)/g, '$1bg-white dark:bg-white/5');
  
  // Clean up any double bg-white
  content = content.replace(/bg-white\s+bg-white/g, 'bg-white');
  content = content.replace(/bg-white\s+dark:bg-white\s+dark:bg-white\/5/g, 'bg-white dark:bg-white/5');

  if (content !== original) {
    fs.writeFileSync(file, content);
  }
});
console.log('Fixed background classes.');
