const https = require('https');
const fs = require('fs');

// Step 1: Fetch the JSON file from GitHub
async function fetchInstrDict() {
  const url = 'https://raw.githubusercontent.com/rpsene/riscv-extensions-landscape/main/src/instr_dict.json';
  
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
      res.on('error', reject);
    });
  });
}

// Step 2: Group instructions by extension tag
function groupByExtension(instrDict) {
  const extensionMap = {};  // { "rv_zba": ["sh1add", "sh2add"...] }
  
  for (const [instrName, instrData] of Object.entries(instrDict)) {
    // Each instruction has a "extension" field (array or string)
    const tags = Array.isArray(instrData.extension) 
      ? instrData.extension 
      : [instrData.extension];
    
    for (const tag of tags) {
      if (!tag) continue;
      if (!extensionMap[tag]) {
        extensionMap[tag] = [];
      }
      extensionMap[tag].push(instrName.toUpperCase());
    }
  }
  
  return extensionMap;
}

// Step 3: Print summary table
function printSummaryTable(extensionMap) {
  console.log('\n=== EXTENSION SUMMARY TABLE ===\n');
  console.log('Extension Tag'.padEnd(25) + 
    'Count'.padEnd(10) + 'Example Mnemonic');
  console.log('-'.repeat(55));
  
  // Sort alphabetically
  const sorted = Object.entries(extensionMap)
    .sort((a, b) => a[0].localeCompare(b[0]));
  
  for (const [tag, instructions] of sorted) {
    console.log(
      tag.padEnd(25) + 
      String(instructions.length).padEnd(10) + 
      instructions[0]
    );
  }
  
  console.log(`\nTotal extensions found: ${sorted.length}`);
}

// Step 4: Find instructions in multiple extensions
function findMultiExtensionInstructions(instrDict) {
  const multiExt = [];
  
  for (const [instrName, instrData] of Object.entries(instrDict)) {
    const tags = Array.isArray(instrData.extension) 
      ? instrData.extension 
      : [instrData.extension];
    
    // Filter out null/undefined
    const validTags = tags.filter(t => t);
    
    if (validTags.length > 1) {
      multiExt.push({
        instruction: instrName.toUpperCase(),
        extensions: validTags
      });
    }
  }
  
  return multiExt;
}

// Main function
async function runTier1() {
  console.log('Fetching instruction dictionary...');
  const instrDict = await fetchInstrDict();
  
  // Save raw data locally for Tier 2 use
  fs.writeFileSync(
    './output/instr_dict_raw.json', 
    JSON.stringify(instrDict, null, 2)
  );
  
  const extensionMap = groupByExtension(instrDict);
  printSummaryTable(extensionMap);
  
  const multiExt = findMultiExtensionInstructions(instrDict);
  
  console.log('\n=== INSTRUCTIONS IN MULTIPLE EXTENSIONS ===\n');
  if (multiExt.length === 0) {
    console.log('None found.');
  } else {
    for (const item of multiExt) {
      console.log(`${item.instruction} → [${item.extensions.join(', ')}]`);
    }
    console.log(`\nTotal: ${multiExt.length} instructions span multiple extensions`);
  }
  
  // Save results
  fs.writeFileSync('./output/tier1_results.json', 
    JSON.stringify({ extensionMap, multiExt }, null, 2));
  
  return { extensionMap, instrDict };
}

module.exports = { fetchInstrDict, groupByExtension, 
  findMultiExtensionInstructions, runTier1 };

// Run if called directly
if (require.main === module) {
  runTier1().catch(console.error);
}