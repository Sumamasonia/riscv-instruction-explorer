// This is the KEY part of the challenge
// rv_zba (JSON format) ↔ Zba (manual format)
function normalizeExtensionName(name) {
  if (!name) return '';
  
  // Remove "rv_" prefix
  let normalized = name.toLowerCase()
    .replace(/^rv_/, '')      // rv_zba → zba
    .replace(/^rv/, '')       // rvi → i
    .replace(/_/g, '')        // remove underscores
    .trim();
  
  return normalized;
}

// Create a lookup map with normalized keys
function buildNormalizedMap(extensionList) {
  const map = {};
  for (const ext of extensionList) {
    const key = normalizeExtensionName(ext);
    if (!map[key]) map[key] = [];
    map[key].push(ext); // keep originals
  }
  return map;
}

module.exports = { normalizeExtensionName, buildNormalizedMap };