const fs = require('fs');

function generateExtensionGraph(instrDict) {
  // Find which extensions share instructions
  const sharedMap = {};  // instruction → [ext1, ext2]
  
  for (const [instrName, instrData] of Object.entries(instrDict)) {
    const tags = Array.isArray(instrData.extension)
      ? instrData.extension
      : [instrData.extension];
    
    const validTags = tags.filter(t => t);
    if (validTags.length > 1) {
      sharedMap[instrName] = validTags;
    }
  }
  
  // Build adjacency list
  const edges = {};
  
  for (const [instr, exts] of Object.entries(sharedMap)) {
    for (let i = 0; i < exts.length; i++) {
      for (let j = i + 1; j < exts.length; j++) {
        const key = `${exts[i]} <-> ${exts[j]}`;
        if (!edges[key]) edges[key] = [];
        edges[key].push(instr);
      }
    }
  }
  
  // Print text-based graph
  console.log('\n=== EXTENSION SHARING GRAPH ===\n');
  console.log('(Extensions connected by shared instructions)\n');
  
  if (Object.keys(edges).length === 0) {
    console.log('No shared instructions found between extensions.');
  } else {
    for (const [connection, instrs] of Object.entries(edges)) {
      console.log(`${connection}`);
      console.log(`  Shared: ${instrs.join(', ')}\n`);
    }
  }
  
  // Also generate DOT format for visualization
  let dotGraph = 'graph ExtensionSharing {\n';
  dotGraph += '  rankdir=LR;\n';
  dotGraph += '  node [shape=box];\n\n';
  
  for (const [connection] of Object.entries(edges)) {
    const [a, b] = connection.split(' <-> ');
    dotGraph += `  "${a}" -- "${b}";\n`;
  }
  
  dotGraph += '}\n';
  
  fs.writeFileSync('./output/extension_graph.dot', dotGraph);
  console.log('Graph saved to output/extension_graph.dot');
  console.log('(Visualize at: https://dreampuf.github.io/GraphvizOnline/)');
  
  return edges;
}

module.exports = { generateExtensionGraph };