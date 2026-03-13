const fs = require('fs');
const path = require('path');

const replacements = [
  { regex: /bg-primary text-white/g, replacement: 'bg-primary text-black' },
  { regex: /bg-primary hover:bg-primary\/80 text-white/g, replacement: 'bg-primary hover:bg-primary/80 text-black' },
  { regex: /text-white group-hover:scale-110/g, replacement: 'text-black group-hover:scale-110' },
  { regex: /text-white mx-auto/g, replacement: 'text-black mx-auto' },
  { regex: /text-white p-1\.5/g, replacement: 'text-black p-1.5' },
  { regex: /text-white px-5/g, replacement: 'text-black px-5' },
  { regex: /text-white px-8/g, replacement: 'text-black px-8' },
  { regex: /text-white px-10/g, replacement: 'text-black px-10' },
  { regex: /text-white px-6/g, replacement: 'text-black px-6' },
  { regex: /text-white py-4/g, replacement: 'text-black py-4' },
  { regex: /text-white px-4/g, replacement: 'text-black px-4' },
  { regex: /text-white px-3/g, replacement: 'text-black px-3' },
  { regex: /text-white px-2/g, replacement: 'text-black px-2' },
  { regex: /text-white text-sm/g, replacement: 'text-black text-sm' },
  { regex: /text-white text-xs/g, replacement: 'text-black text-xs' },
  { regex: /text-white font-bold/g, replacement: 'text-black font-bold' },
  { regex: /text-white shadow-xl/g, replacement: 'text-black shadow-xl' },
  { regex: /text-white flex/g, replacement: 'text-black flex' },
  { regex: /text-white rounded-tr-none/g, replacement: 'text-black rounded-tr-none' },
  { regex: /text-white rounded-lg/g, replacement: 'text-black rounded-lg' },
  { regex: /hover:text-white/g, replacement: 'hover:text-black' },
];

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(function(file) {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) { 
      results = results.concat(walk(file));
    } else { 
      if (file.endsWith('.tsx') || file.endsWith('.ts') || file.endsWith('.css')) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = walk('./src');
files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;
  
  replacements.forEach(({ regex, replacement }) => {
    // Only replace text-white if it's accompanied by bg-primary in the same class string
    // Actually, the previous script replaced text-black with text-white blindly.
    // Let's just run the inverse of the previous script.
    content = content.replace(regex, replacement);
  });
  
  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Updated ${file}`);
  }
});
