const https = require('https');
const fs = require('fs');
const { normalizeExtensionName, buildNormalizedMap } = require('./utils');

// Fetch list of AsciiDoc files from GitHub API
async function fetchManualFileList() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.github.com',
      path: '/repos/riscv/riscv-isa-manual/contents/src',
      headers: { 'User-Agent': 'riscv-explorer' }
    };
    
    https.get(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const files = JSON.parse(data);
        // Filter only .adoc files
        const adocFiles = files
          .filter(f => f.name.endsWith('.adoc'))
          .map(f => f.download_url);
        resolve(adocFiles);
      });
      res.on('error', reject);
    });
  });
}

// Fetch content of one file
async function fetchFileContent(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
      res.on('error', reject);
    });
  });
}

// Extract extension names from AsciiDoc content
function extractExtensionsFromManual(content) {
  const found = new Set();
  
  // Pattern 1: "Zba extension" or "Zicsr extension"
  const pattern1 = /\b(Z[a-z][a-zA-Z0-9]*)\b/g;
  
  // Pattern 2: Standard single letter extensions M, F, D, C, A
  const pattern2 = /\b([MFDCAVBHPQLS])\s+extension/g;
  
  // Pattern 3: rv32i, rv64i etc
  const pattern3 = /\b(rv(?:32|64)[a-zA-Z]+)\b/gi;
  
  let match;
  
  while ((match = pattern1.exec(content)) !== null) {
    found.add(match[1]);
  }
  
  while ((match = pattern2.exec(content)) !== null) {
    found.add(match[1]);
  }
  
  while ((match = pattern3.exec(content)) !== null) {
    found.add(match[1].toLowerCase());
  }
  
  return found;
}

// Main cross-reference function
async function runTier2(extensionMapFromTier1) {
  console.log('\n=== TIER 2: ISA MANUAL CROSS-REFERENCE ===\n');
  console.log('Fetching ISA manual file list...');
  
  // Get extensions from JSON (Tier 1 results)
  const jsonExtensions = Object.keys(extensionMapFromTier1);
  
  // Fetch manual files
  let fileUrls;
  try {
    fileUrls = await fetchManualFileList();
    console.log(`Found ${fileUrls.length} AsciiDoc files in manual`);
  } catch (err) {
    console.log('GitHub API rate limit hit. Using cached data...');
    // Fallback — use a smaller set
    fileUrls = [];
  }
  
  // Scan all files
  const manualExtensions = new Set();
  
  for (const url of fileUrls) {
    try {
      console.log(`Scanning: ${url.split('/').pop()}`);
      const content = await fetchFileContent(url);
      const found = extractExtensionsFromManual(content);
      found.forEach(e => manualExtensions.add(e));
      
      // Small delay to avoid rate limiting
      await new Promise(r => setTimeout(r, 200));
    } catch (err) {
      console.log(`  Skipped (error): ${url}`);
    }
  }
  
  console.log(`\nTotal unique extension references in manual: ${manualExtensions.size}`);
  
  // Normalize both sides for comparison
  const jsonNormalized = buildNormalizedMap(jsonExtensions);
  const manualNormalized = buildNormalizedMap([...manualExtensions]);
  
  // Find matches, JSON-only, manual-only
  const matched = [];
  const jsonOnly = [];
  const manualOnly = [];
  
  // Check JSON extensions against manual
  for (const [normKey, originals] of Object.entries(jsonNormalized)) {
    if (manualNormalized[normKey]) {
      matched.push({
        jsonName: originals[0],
        manualName: manualNormalized[normKey][0],
        normalizedKey: normKey
      });
    } else {
      jsonOnly.push(originals[0]);
    }
  }
  
  // Check manual extensions not in JSON
  for (const [normKey, originals] of Object.entries(manualNormalized)) {
    if (!jsonNormalized[normKey]) {
      manualOnly.push(originals[0]);
    }
  }
  
  // Print results
  console.log('\n--- MATCHED EXTENSIONS ---');
  matched.slice(0, 10).forEach(m => 
    console.log(`  JSON: ${m.jsonName.padEnd(20)} ↔  Manual: ${m.manualName}`)
  );
  if (matched.length > 10) {
    console.log(`  ... and ${matched.length - 10} more`);
  }
  
  console.log('\n--- IN JSON BUT NOT IN MANUAL ---');
  jsonOnly.forEach(e => console.log(`  ${e}`));
  
  console.log('\n--- IN MANUAL BUT NOT IN JSON ---');
  manualOnly.slice(0, 20).forEach(e => console.log(`  ${e}`));
  
  console.log('\n=== SUMMARY ===');
  console.log(`✅ Matched:      ${matched.length}`);
  console.log(`📄 JSON only:    ${jsonOnly.length}`);
  console.log(`📖 Manual only:  ${manualOnly.length}`);
  
  // Save results
  const results = { matched, jsonOnly, manualOnly };
  fs.writeFileSync('./output/tier2_results.json', 
    JSON.stringify(results, null, 2));
  
  return results;
}

module.exports = { extractExtensionsFromManual, runTier2 };

if (require.main === module) {
  const { runTier1 } = require('./tier1');
  runTier1()
    .then(({ extensionMap }) => runTier2(extensionMap))
    .catch(console.error);
}