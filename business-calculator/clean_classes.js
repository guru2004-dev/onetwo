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
console.log(`Found ${files.length} calculator files to clean.`);

let totalModified = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  // Generic deduplicator loop to clean up all repetitive dark:x dark:x dark:y messes
  for (let i = 0; i < 5; i++) {
    content = content.replace(/bg-white(?:\s+dark:bg-white)+/g, 'bg-white');
    content = content.replace(/bg-white(?:\s+bg-white)+/g, 'bg-white');
    content = content.replace(/dark:bg-white\/5(?:\s+dark:bg-white\/5)+/g, 'dark:bg-white/5');
    
    content = content.replace(/border-gray-200(?:\s+dark:border-gray-200)+/g, 'border-gray-200');
    content = content.replace(/border-gray-200(?:\s+border-gray-200)+/g, 'border-gray-200');
    content = content.replace(/dark:border-white\/10(?:\s+dark:border-white\/10)+/g, 'dark:border-white/10');
    
    content = content.replace(/text-slate-900(?:\s+dark:text-slate-900)+/g, 'text-slate-900');
    content = content.replace(/text-slate-900(?:\s+text-slate-900)+/g, 'text-slate-900');
    content = content.replace(/dark:text-white(?:\s+dark:text-white)+/g, 'dark:text-white');
    
    content = content.replace(/text-slate-700(?:\s+dark:text-slate-700)+/g, 'text-slate-700');
    content = content.replace(/text-slate-700(?:\s+text-slate-700)+/g, 'text-slate-700');
    content = content.replace(/dark:text-slate-300(?:\s+dark:text-slate-300)+/g, 'dark:text-slate-300');
    
    content = content.replace(/text-slate-600(?:\s+dark:text-slate-600)+/g, 'text-slate-600');
    content = content.replace(/text-slate-600(?:\s+text-slate-600)+/g, 'text-slate-600');
    content = content.replace(/dark:text-slate-400(?:\s+dark:text-slate-400)+/g, 'dark:text-slate-400');
    
    content = content.replace(/shadow-sm dark:shadow-2xl rounded-2xl shadow-2xl/g, 'shadow-md dark:shadow-2xl rounded-2xl');
    content = content.replace(/shadow-sm dark:shadow-2xl/g, 'shadow-md dark:shadow-2xl');
  }

  // Refine light mode aesthetics: the cards need to pop
  // Original script made background: bg-white. Let's make it bg-white in light mode.
  // And borders: border-slate-200
  
  if (content !== original) {
    fs.writeFileSync(file, content);
    totalModified++;
  }
});

// Fix `CalculatorCard.tsx` separately
const cardPath = 'components/CalculatorCard.tsx';
if (fs.existsSync(cardPath)) {
    let cardContent = fs.readFileSync(cardPath, 'utf8');
    let originalCard = cardContent;
    
    // Convert to dual theme supporting card: bg-slate-50 or bg-white hover:bg-slate-100 border-slate-200
    // Dark mode: dark:bg-white/[0.03] dark:hover:bg-white/[0.05] dark:border-white/10 dark:hover:border-indigo-500/50
    cardContent = cardContent.replace(
        'bg-white/[0.03] hover:bg-white/[0.05] border border-white/10 hover:border-indigo-500/50 backdrop-blur-xl',
        'bg-white dark:bg-white/[0.03] hover:bg-slate-50 dark:hover:bg-white/[0.05] border border-slate-200 dark:border-white/10 hover:border-indigo-500/50 dark:hover:border-indigo-500/50 backdrop-blur-xl shadow-md dark:shadow-2xl'
    );
    cardContent = cardContent.replace(
        'text-white mb-2 tracking-tight group-hover:text-cyan-300',
        'text-slate-900 dark:text-white mb-2 tracking-tight group-hover:text-cyan-600 dark:group-hover:text-cyan-300'
    );
    cardContent = cardContent.replace(
        'text-gray-400 font-light leading-relaxed mb-6 group-hover:text-gray-300',
        'text-slate-600 dark:text-gray-400 font-light leading-relaxed mb-6 group-hover:text-slate-900 dark:group-hover:text-gray-300'
    );
    cardContent = cardContent.replace(
        'border-t border-white/5 flex items-center justify-between text-cyan-400',
        'border-t border-slate-200 dark:border-white/5 flex items-center justify-between text-cyan-600 dark:text-cyan-400'
    );
    cardContent = cardContent.replace(
        '<IconComponent className="w-6 h-6 md:w-7 md:h-7 text-white transform group-hover:scale-110 transition-transform duration-300" />',
        '<IconComponent className="w-6 h-6 md:w-7 md:h-7 text-white transform group-hover:scale-110 transition-transform duration-300" />'
    );
    // The icon container uses gradients, that's fine it looks good.

    if (cardContent !== originalCard) {
        fs.writeFileSync(cardPath, cardContent);
        console.log("Updated CalculatorCard.tsx");
    }
}

console.log(`Cleaned ${totalModified} files. Update finished.`);
