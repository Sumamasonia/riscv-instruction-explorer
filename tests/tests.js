const { groupByExtension, 
  findMultiExtensionInstructions } = require('../src/tier1');
const { extractExtensionsFromManual } = require('../src/tier2');
const { normalizeExtensionName } = require('../src/utils');

// Mock data for testing
const mockInstrDict = {
  "add": { "extension": ["rv_i"], "encoding": "0000000" },
  "mul": { "extension": ["rv_m"], "encoding": "0000001" },
  "fadd.s": { "extension": ["rv_f"], "encoding": "0000010" },
  "sh1add": { "extension": ["rv_zba"], "encoding": "0010000" },
  "shared_instr": { 
    "extension": ["rv_i", "rv_e"], 
    "encoding": "1111111" 
  }
};

// Test 1: groupByExtension
function testGroupByExtension() {
  const result = groupByExtension(mockInstrDict);
  
  console.assert(result['rv_i'].includes('ADD'), 
    'FAIL: rv_i should contain ADD');
  console.assert(result['rv_m'].includes('MUL'), 
    'FAIL: rv_m should contain MUL');
  console.assert(result['rv_zba'].length === 1, 
    'FAIL: rv_zba should have 1 instruction');
  
  console.log('✅ Test 1 PASSED: groupByExtension');
}

// Test 2: findMultiExtensionInstructions
function testMultiExtension() {
  const result = findMultiExtensionInstructions(mockInstrDict);
  
  console.assert(result.length === 1, 
    'FAIL: Should find exactly 1 multi-extension instruction');
  console.assert(result[0].instruction === 'SHARED_INSTR', 
    'FAIL: Should be SHARED_INSTR');
  console.assert(result[0].extensions.includes('rv_i'), 
    'FAIL: Should include rv_i');
  
  console.log('✅ Test 2 PASSED: findMultiExtensionInstructions');
}

// Test 3: normalizeExtensionName
function testNormalization() {
  console.assert(normalizeExtensionName('rv_zba') === 'zba',
    'FAIL: rv_zba should normalize to zba');
  console.assert(normalizeExtensionName('rv_i') === 'i',
    'FAIL: rv_i should normalize to i');
  console.assert(normalizeExtensionName('Zba') === 'zba',
    'FAIL: Zba should normalize to zba');
  
  console.log('✅ Test 3 PASSED: normalizeExtensionName');
}

// Test 4: extractExtensionsFromManual
function testExtractFromManual() {
  const mockContent = `
    The Zba extension provides instructions for address generation.
    The M extension adds multiply/divide operations.
    See also Zicsr for CSR instructions.
    rv32i base integer instruction set.
  `;
  
  const result = extractExtensionsFromManual(mockContent);
  
  console.assert(result.has('Zba'), 'FAIL: Should find Zba');
  console.assert(result.has('Zicsr'), 'FAIL: Should find Zicsr');
  
  console.log('✅ Test 4 PASSED: extractExtensionsFromManual');
}

// Run all tests
console.log('\n=== RUNNING TESTS ===\n');
testGroupByExtension();
testMultiExtension();
testNormalization();
testExtractFromManual();
console.log('\n=== ALL TESTS PASSED ===\n');