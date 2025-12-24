
import { NextResponse } from 'next/server';
import { autoCategorizeTags } from '@/app/actions/auto-categorize';

export async function GET() {
  const result = await autoCategorizeTags();
  return NextResponse.json(result);
}
