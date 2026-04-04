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
console.log(`Found ${files.length} calculator files`);

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  // Background Gradients
  content = content.replace(/from-slate-900 via-slate-800 to-([a-zA-Z]+)-950/g, 'from-slate-50 dark:from-slate-900 via-slate-100 dark:via-slate-800 to-$1-100 dark:to-$1-950');
  content = content.replace(/from-slate-900 via-([a-zA-Z]+)-950 to-slate-900/g, 'from-slate-50 dark:from-slate-900 via-$1-100 dark:via-$1-950 to-slate-100 dark:to-slate-900');
  content = content.replace(/from-slate-900 via-slate-800 to-slate-900/g, 'from-slate-50 dark:from-slate-900 via-slate-100 dark:via-slate-800 to-slate-200 dark:to-slate-900');
  
  // Layout containers and borders
  content = content.replace(/bg-white\/5 backdrop-blur-xl border border-white\/10/g, 'bg-white dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-white/10 shadow-sm dark:shadow-2xl');
  content = content.replace(/bg-white\/5/g, 'bg-white dark:bg-white/5');
  content = content.replace(/border-white\/10/g, 'border-gray-200 dark:border-white/10');
  content = content.replace(/border-white\/5/g, 'border-gray-100 dark:border-white/5');
  content = content.replace(/divide-white\/5/g, 'divide-gray-100 dark:divide-white/5');

  // Typography - Note: careful with text-white
  content = content.replace(/text-white/g, 'text-slate-900 dark:text-white');
  content = content.replace(/text-slate-400/g, 'text-slate-600 dark:text-slate-400');
  content = content.replace(/text-slate-300/g, 'text-slate-700 dark:text-slate-300');
  content = content.replace(/text-slate-200/g, 'text-slate-800 dark:text-slate-200');

  // Input & Empty state Backgrounds
  content = content.replace(/bg-slate-900\/50/g, 'bg-transparent dark:bg-slate-900/50');
  content = content.replace(/bg-slate-800\/50/g, 'bg-gray-50 dark:bg-slate-800/50');
  content = content.replace(/bg-slate-800/g, 'bg-white dark:bg-slate-800');
  content = content.replace(/bg-slate-900\/40/g, 'bg-gray-50 dark:bg-slate-900/40');
  content = content.replace(/bg-black\/20/g, 'bg-gray-100 dark:bg-black/20');

  // Table header background
  content = content.replace(/bg-white dark:bg-white\/5 text-slate-600 dark:text-slate-400 font-semibold/g, 'bg-gray-50 dark:bg-white/5 text-slate-600 dark:text-slate-400 font-semibold');

  // Chart Tooltips Fix
  content = content.replace(/backgroundColor: '#1e293b'/g, 'backgroundColor: \'rgba(30, 41, 59, 0.95)\''); // works fine in light mode too, but better if we can use css classes. Tooltips usually accept style object. Dark bg is fine.

  // Regressions: Re-fix standard colored buttons/badges that shouldn't pivot to slate-900
  // "text-slate-900 dark:text-white text-sm font-semibold rounded-xl" with bg-emerald-600
  content = content.replace(/(bg-[a-zA-Z]+-600[\w\s:-]*)text-slate-900 dark:text-white/g, '$1text-white');
  content = content.replace(/text-slate-900 dark:text-white([\w\s:-]*bg-[a-zA-Z]+-600)/g, 'text-white$1');

  if (content !== original) {
    fs.writeFileSync(file, content);
  }
});

console.log('Update finished.');
