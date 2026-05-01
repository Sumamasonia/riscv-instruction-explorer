# RISC-V Instruction Set Explorer

Analyzes RISC-V instruction extensions by parsing 
instr_dict.json and cross-referencing with the ISA manual.

## Installation


```bash
git clone https://github.com/Sumamasonia/riscv-explorer
cd riscv-explorer
npm install
```

## Usage

```bash
# Run all tiers
node index.js

# Run individually
node src/tier1.js    # Parsing only
node src/tier2.js    # Cross-reference only
node tests/tests.js  # Run tests
```

## Sample Output
Extension Tag            Count     Example Mnemonic
rv_i                     40        ADD
rv_m                     8         MUL
rv_zba                   4         SH1ADD
✅ Matched:      42
📄 JSON only:    3
📖 Manual only:  5

## Design Decisions

- Normalization: rv_zba → zba, Zba → zba 
  (lowercase + remove rv_ prefix)
- GitHub API used for manual scanning
- DOT format graph saved for Graphviz visualization