import { NextRequest, NextResponse } from 'next/server';
import { reprocessExistingMemories } from '@/app/actions/reprocess-memories';

export async function POST(request: NextRequest) {
  try {
    const { personId } = await request.json();

    if (!personId) {
      return NextResponse.json(
        { error: 'personId is required' },
        { status: 400 }
      );
    }

    const result = await reprocessExistingMemories(personId);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json(result);

  } catch (error) {
    console.error('Error in reprocess-memories API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
