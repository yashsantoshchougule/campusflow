export function extractQuotes(citationPointers, blocks) {
  const citations = [];

  for (const pointer of citationPointers) {
    const block = blocks.find((b) => b._id.toString() === pointer.blockId);

    if (!block) continue;

    // Extract quote from block text
    // Strategy: find the most relevant segment based on pointer.relevantText
    let quote = "";

    if (pointer.relevantText) {
      // Try to find the described text in the block
      const searchTerms = pointer.relevantText
        .toLowerCase()
        .split(" ")
        .slice(0, 5);
      const blockLower = block.text.toLowerCase();

      // Find best match position
      let bestPos = -1;
      let bestScore = 0;

      for (let i = 0; i < block.text.length - 50; i++) {
        const segment = blockLower.substring(i, i + 200);
        const score = searchTerms.filter((term) =>
          segment.includes(term)
        ).length;
        if (score > bestScore) {
          bestScore = score;
          bestPos = i;
        }
      }

      if (bestPos >= 0) {
        // Extract ~150 chars around best position
        const start = Math.max(0, bestPos - 50);
        const end = Math.min(block.text.length, bestPos + 150);
        quote = block.text.substring(start, end).trim();
        if (start > 0) quote = "..." + quote;
        if (end < block.text.length) quote = quote + "...";
      }
    }

    // Fallback: use first 150 chars of block
    if (!quote) {
      quote = block.text.substring(0, 150).trim();
      if (block.text.length > 150) quote += "...";
    }

    citations.push({
      sourceRef: block.sourceRef,
      blockId: block._id,
      quote,
    });
  }

  return citations;
}
