const { runTier1 } = require('./src/tier1');
const { runTier2 } = require('./src/tier2');
const { generateExtensionGraph } = require('./src/tier3');

async function main() {
  console.log('🔍 RISC-V Instruction Set Explorer');
  console.log('=====================================\n');
  
  // Tier 1
  console.log('📊 TIER 1: Parsing instruction dictionary...');
  const { extensionMap, instrDict } = await runTier1();
  
  // Tier 2
  console.log('\n📖 TIER 2: Cross-referencing with ISA manual...');
  await runTier2(extensionMap);
  
  // Tier 3
  console.log('\n🕸️  TIER 3: Generating extension sharing graph...');
  generateExtensionGraph(instrDict);
  
  console.log('\n✅ All tiers complete! Results saved in ./output/');
}

main().catch(console.error);