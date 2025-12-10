import { subYears, format } from 'date-fns';
import { PaperMetadata, PaperMetadataSchema } from './types';

interface ArxivFeedEntry {
  id: string[];
  title: string[];
  author: Array<{ name: string[] }>;
  summary: string[];
  link: Array<{ $: { href: string; type?: string; title?: string } }>;
  published: string[];
  category?: Array<{ $: { term: string } }>;
}

interface ArxivFeed {
  entry?: ArxivFeedEntry[];
}

const ARXIV_API_BASE = 'http://export.arxiv.org/api/query';

export async function querySiggraphPapers(): Promise<PaperMetadata[]> {
  const threeYearsAgo = subYears(new Date(), 3);
  const formattedDate = format(threeYearsAgo, 'yyyy-MM-dd');

  // Query for SIGGRAPH papers from the last 3 years
  // Using multiple searches for different relevant categories
  const queries = [
    `cat:cs.GR+AND+submittedDate:[${formattedDate}000000+TO+9999999999]`,
    `(ti:SIGGRAPH+OR+abs:SIGGRAPH)+AND+submittedDate:[${formattedDate}000000+TO+9999999999]`,
  ];

  const allPapers: PaperMetadata[] = [];
  const seenIds = new Set<string>();

  for (const query of queries) {
    try {
      const url = `${ARXIV_API_BASE}?search_query=${query}&start=0&max_results=100&sortBy=submittedDate&sortOrder=descending`;
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'SIGGRAPH-Discovery/1.0',
        },
      });

      if (!response.ok) {
        console.warn(`ArXiv query failed with status ${response.status}`);
        continue;
      }

      const text = await response.text();
      const feed = parseArxivXml(text);

      if (feed.entry) {
        for (const entry of feed.entry) {
          const arxivId = extractArxivId(entry.id[0]);

          if (seenIds.has(arxivId)) {
            continue;
          }
          seenIds.add(arxivId);

          try {
            const paper = parseArxivEntry(entry);
            allPapers.push(paper);
          } catch (e) {
            console.warn(`Failed to parse entry: ${e}`);
          }
        }
      }
      
      // Add delay between requests to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`Error querying arXiv: ${error}`);
    }
  }

  return allPapers;
}

function extractArxivId(idUrl: string): string {
  // arXiv IDs are in the format: http://arxiv.org/abs/XXXX.XXXXX
  const match = idUrl.match(/(\d{4}\.\d{4,5})/);
  return match ? match[1] : idUrl;
}

function parseArxivEntry(entry: ArxivFeedEntry): PaperMetadata {
  const id = entry.id[0];
  const arxivId = extractArxivId(id);
  const title = entry.title[0].trim();
  const authors = entry.author
    ? entry.author.map((a) => a.name[0].trim())
    : [];
  const abstract = entry.summary[0].trim().replace(/\s+/g, ' ');

  // Find PDF link
  let pdfUrl = '';
  if (entry.link) {
    const pdfLink = entry.link.find(
      (l) => l.$?.type === 'application/pdf' || l.$?.title === 'pdf'
    );
    if (pdfLink) {
      pdfUrl = pdfLink.$?.href || '';
    }
    if (!pdfUrl) {
      const absLink = entry.link.find((l) => !l.$?.type);
      if (absLink) {
        pdfUrl = (absLink.$?.href || '').replace('/abs/', '/pdf/') + '.pdf';
      }
    }
  }

  const publishedAt = entry.published[0];
  const categories = entry.category
    ? entry.category.map((c) => c.$?.term || '').filter(Boolean)
    : [];

  return PaperMetadataSchema.parse({
    id: arxivId,
    title,
    authors,
    abstract,
    pdfUrl,
    publishedAt,
    arxivId,
    categories,
  });
}

function parseArxivXml(xml: string): ArxivFeed {
  // Simple XML parsing without external dependencies
  const entries: ArxivFeedEntry[] = [];

  // Extract individual entry elements
  const entryMatches = xml.matchAll(/<entry[^>]*>([\s\S]*?)<\/entry>/g);

  for (const match of entryMatches) {
    const entryXml = match[1];
    const entry: ArxivFeedEntry = {
      id: extractXmlElements(entryXml, 'id'),
      title: extractXmlElements(entryXml, 'title'),
      summary: extractXmlElements(entryXml, 'summary'),
      author: extractAuthors(entryXml),
      link: extractLinks(entryXml),
      published: extractXmlElements(entryXml, 'published'),
      category: extractCategories(entryXml),
    };

    entries.push(entry);
  }

  return { entry: entries };
}

function extractXmlElements(xml: string, tag: string): string[] {
  const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'g');
  const results: string[] = [];
  let match;

  while ((match = regex.exec(xml)) !== null) {
    const text = match[1]
      .replace(/<[^>]+>/g, '')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .trim();
    results.push(text);
  }

  return results;
}

function extractAuthors(
  xml: string
): Array<{ name: string[] }> {
  const authors: Array<{ name: string[] }> = [];
  const authorMatches = xml.matchAll(/<author[^>]*>([\s\S]*?)<\/author>/g);

  for (const match of authorMatches) {
    const authorXml = match[1];
    const names = extractXmlElements(authorXml, 'name');
    if (names.length > 0) {
      authors.push({ name: names });
    }
  }

  return authors;
}

function extractLinks(
  xml: string
): Array<{ $: { href: string; type?: string; title?: string } }> {
  const links: Array<{ $: { href: string; type?: string; title?: string } }> =
    [];
  const linkMatches = xml.matchAll(/<link[^>]*>/g);

  for (const match of linkMatches) {
    const linkTag = match[0];
    const hrefMatch = linkTag.match(/href="([^"]*)"/);
    const typeMatch = linkTag.match(/type="([^"]*)"/);
    const titleMatch = linkTag.match(/title="([^"]*)"/);

    if (hrefMatch) {
      links.push({
        $: {
          href: hrefMatch[1],
          type: typeMatch ? typeMatch[1] : undefined,
          title: titleMatch ? titleMatch[1] : undefined,
        },
      });
    }
  }

  return links;
}

function extractCategories(
  xml: string
): Array<{ $: { term: string } }> {
  const categories: Array<{ $: { term: string } }> = [];
  const categoryMatches = xml.matchAll(/<category[^>]*>/g);

  for (const match of categoryMatches) {
    const categoryTag = match[0];
    const termMatch = categoryTag.match(/term="([^"]*)"/);

    if (termMatch) {
      categories.push({
        $: {
          term: termMatch[1],
        },
      });
    }
  }

  return categories;
}
