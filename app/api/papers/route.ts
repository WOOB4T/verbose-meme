import { NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';
import { PapersIndexSchema } from '@/lib/papers/types';

export const revalidate = 3600; // ISR cache for 1 hour

async function getPapersData() {
  try {
    const papersPath = path.join(process.cwd(), 'data', 'papers.json');

    if (!fs.existsSync(papersPath)) {
      return null;
    }

    const fileContent = fs.readFileSync(papersPath, 'utf-8');
    const data = JSON.parse(fileContent);

    // Validate against schema
    const validated = PapersIndexSchema.parse(data);
    return validated;
  } catch (error) {
    console.error('Error reading papers data:', error);
    return null;
  }
}

export async function GET() {
  try {
    const papersData = await getPapersData();

    if (!papersData) {
      return NextResponse.json(
        {
          error: 'Papers data not found. Run npm run papers:sync first.',
          papers: [],
          totalCount: 0,
          lastUpdated: null,
        },
        { status: 404 }
      );
    }

    // Add cache headers for ISR
    const response = NextResponse.json(papersData);
    response.headers.set('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');

    return response;
  } catch (error) {
    console.error('Error in papers API:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        papers: [],
        totalCount: 0,
      },
      { status: 500 }
    );
  }
}
