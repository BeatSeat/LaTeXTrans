export function extractArxivId(input: string): string | null {
  input = input.trim();

  // Matches formats like "2401.12345" or "astro-ph/9876543"
  const directIdMatch = input.match(
    /^\d{4}\.\d{4,}(v\d+)?$|^[a-zA-Z\.\-]+\/\d+$/
  );
  if (directIdMatch) {
    return directIdMatch[0];
  }

  // Matches standard arXiv URLs (abs or pdf)
  const arxivUrlMatch = input.match(
    /https?:\/\/(?:www\.)?arxiv\.org\/(abs|pdf)\/(\d{4}\.\d{4,})(v\d+)?/
  );
  if (arxivUrlMatch) {
    return arxivUrlMatch[2];
  }

  // Matches alphaXiv URLs (less common but seen)
  const alphaXivUrlMatch = input.match(
    /https?:\/\/(?:www\.)?alphaxiv\.org\/(abs|pdf)\/(\d{4}\.\d{4,})(v\d+)?/
  );
  if (alphaXivUrlMatch) {
    return alphaXivUrlMatch[2];
  }

  // Matches old format arXiv URLs like "math.GT/0309136"
  const oldFormatUrlMatch = input.match(
    /https?:\/\/(?:www\.)?arxiv\.org\/(abs|pdf)\/([a-zA-Z\.\-]+\/\d+)/
  );
  if (oldFormatUrlMatch) {
    return oldFormatUrlMatch[2];
  }

  return null;
}
