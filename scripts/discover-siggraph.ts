import * as fs from 'fs';
import * as path from 'path';
import { querySiggraphPapers } from '../lib/papers/arxivClient';
import { classifyPaper } from '../lib/papers/classifier';
import { PapersIndexSchema } from '../lib/papers/types';

const DATA_DIR = path.join(process.cwd(), 'data');
const PAPERS_FILE = path.join(DATA_DIR, 'papers.json');

async function main() {
  try {
    console.log('🔍 Starting SIGGRAPH paper discovery...');

    // Ensure data directory exists
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    console.log('📡 Querying arXiv for SIGGRAPH papers...');
    const papers = await querySiggraphPapers();
    console.log(`✓ Found ${papers.length} papers`);

    console.log('🤖 Classifying papers...');
    const classifiedPapers = papers.map((paper) => ({
      metadata: paper,
      classifier: classifyPaper(paper),
    }));

    console.log('✓ Classification complete');

    // Calculate statistics
    const techniqueStats: Record<string, number> = {};
    const realTimeScores: number[] = [];

    for (const paper of classifiedPapers) {
      realTimeScores.push(paper.classifier.realTimeFeability);
      for (const technique of paper.classifier.techniqueCategories) {
        techniqueStats[technique] = (techniqueStats[technique] || 0) + 1;
      }
    }

    // Create papers index
    const index = PapersIndexSchema.parse({
      papers: classifiedPapers,
      lastUpdated: new Date().toISOString(),
      totalCount: classifiedPapers.length,
    });

    // Write to file
    fs.writeFileSync(PAPERS_FILE, JSON.stringify(index, null, 2));
    console.log(`✓ Saved ${classifiedPapers.length} papers to ${PAPERS_FILE}`);

    // Log summary stats
    console.log('\n📊 Summary Statistics:');
    console.log(`  Total Papers: ${classifiedPapers.length}`);
    if (realTimeScores.length > 0) {
      console.log(
        `  Avg Real-Time Feasibility: ${(
          realTimeScores.reduce((a, b) => a + b, 0) / realTimeScores.length
        ).toFixed(2)}`
      );
      console.log(`  Max Feasibility: ${Math.max(...realTimeScores).toFixed(2)}`);
      console.log(`  Min Feasibility: ${Math.min(...realTimeScores).toFixed(2)}`);
    } else {
      console.log('  Avg Real-Time Feasibility: N/A');
      console.log('  Max Feasibility: N/A');
      console.log('  Min Feasibility: N/A');
    }

    console.log('\n🎯 Technique Distribution:');
    const sortedTechniques = Object.entries(techniqueStats)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10);

    for (const [technique, count] of sortedTechniques) {
      const percentage = ((count / classifiedPapers.length) * 100).toFixed(1);
      console.log(`  ${technique}: ${count} papers (${percentage}%)`);
    }

    console.log('\n✅ SIGGRAPH paper discovery completed successfully!');
  } catch (error) {
    console.error('❌ Error during paper discovery:', error);
    process.exit(1);
  }
}

main();
