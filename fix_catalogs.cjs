const fs = require('fs');
const path = require('path');

const catalogsPath = path.join(__dirname, 'src', 'data', 'games', 'catalog');

function toTitleCase(str) {
  return str
    .replace(/([a-z])([A-Z0-9])/g, '$1 $2') // space before capital letters and numbers
    .replace(/([0-9])([a-zA-Z])/g, '$1 $2') // space after numbers
    .replace(/[_-]/g, ' ') // underscores and dashes become spaces
    .replace(/\s+/g, ' ') // collapse multiple spaces
    .trim()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

function processCatalog(filename, nameFormatter) {
  const filePath = path.join(catalogsPath, filename);
  let data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  
  const uniqueNames = new Set();
  const newData = [];
  
  for (const entry of data) {
    let newName = nameFormatter(entry.url, entry.name);
    // strip the (1), (2) bits from the name
    newName = newName.replace(/\(\d+\)/g, '').trim();
    
    if (newName.toLowerCase() === '1') continue; // drop the garbage entries
    if (newName.toLowerCase() === 'c') continue;
    
    // some urls are dupes logically but have different paths
    const normalizeName = newName.toLowerCase().replace(/[^a-z0-9]/g, '');
    
    if (!uniqueNames.has(normalizeName) && normalizeName.length > 0) {
      uniqueNames.add(normalizeName);
      
      entry.name = newName;
      newData.push(entry);
    }
  }
  
  // sort alphabetically
  newData.sort((a, b) => a.name.localeCompare(b.name));
  
  fs.writeFileSync(filePath, JSON.stringify(newData, null, 2));
  console.log(`Processed ${filename}, original size: ${data.length}, new size: ${newData.length}`);
}

// ugs is flat, each game is a single /cl<name>.html blob
processCatalog('ugs.json', (url, oldName) => {
  let base = url;
  if (base.startsWith('/cl')) {
    base = base.substring(3);
  } else if (base.startsWith('/')) {
    base = base.substring(1);
  }

  if (base.endsWith('.html')) {
    base = base.substring(0, base.length - 5);
  }

  base = base.replace(/%20/g, ' ').replace(/\s*\(\d+\)\s*$/, '');
  return toTitleCase(base);
});

processCatalog('seraph.json', (url, oldName) => {
  let base = url;
  if (base.startsWith('/')) base = base.substring(1);
  if (base.endsWith('/index.html')) base = base.substring(0, base.length - 11);
  base = base.replace(/%20/g, ' ');
  return toTitleCase(base);
});

processCatalog('truffled.json', (url, oldName) => {
  // dedupe by name
  return oldName.replace(/_/g, ' ').trim();
});
