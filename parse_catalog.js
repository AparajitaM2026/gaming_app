const fs = require('fs');
const path = require('path');

const docXmlPath = 'C:\\Users\\DELL\\.gemini\\antigravity\\scratch\\docx_extracted\\word\\document.xml';
const relsXmlPath = 'C:\\Users\\DELL\\.gemini\\antigravity\\scratch\\docx_extracted\\word\\_rels\\document.xml.rels';

let docXml = fs.readFileSync(docXmlPath, 'utf8');
let relsXml = fs.existsSync(relsXmlPath) ? fs.readFileSync(relsXmlPath, 'utf8') : '';

// Parse Hyperlink targets from rels
const relMap = {};
const relRegex = /<Relationship[^>]*Id="([^"]*)"[^>]*Target="([^"]*)"[^>]*\/>/g;
let m;
while ((m = relRegex.exec(relsXml)) !== null) {
  relMap[m[1]] = m[2];
}

console.log(`Found ${Object.keys(relMap).length} relationship targets (links).`);

// Extract paragraphs and table cells
// Split by <w:p>
const paragraphs = docXml.split(/<\/w:p>/);
console.log(`Total paragraphs: ${paragraphs.length}`);

const extracted = [];

paragraphs.forEach((p, idx) => {
  // Extract text within <w:t>
  const textMatches = p.match(/<w:t[^>]*>([^<]*)<\/w:t>/g) || [];
  const text = textMatches.map(t => t.replace(/<[^>]*>/g, '')).join('').trim();
  
  // Extract hyperlink if any
  const linkMatch = p.match(/r:id="([^"]*)"/);
  const targetUrl = linkMatch && relMap[linkMatch[1]] ? relMap[linkMatch[1]] : null;

  if (text.length > 0 || targetUrl) {
    extracted.push({ text, targetUrl });
  }
});

fs.writeFileSync('C:\\Users\\DELL\\.gemini\\antigravity\\scratch\\extracted_catalog.json', JSON.stringify(extracted, null, 2));
console.log(`Extracted ${extracted.length} non-empty items. Saved to scratch\\extracted_catalog.json`);

// Print first 30 items
console.log(extracted.slice(0, 30));
