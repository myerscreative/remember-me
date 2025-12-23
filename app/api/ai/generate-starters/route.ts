import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth/session';
import { ConversationStarterGenerator } from '@/lib/ai/conversation-starters';
import { ContactContext } from '@/lib/ai/prompts';

export async function POST(request: NextRequest) {
  try {
    // Get authenticated session
    const session = await getCurrentSession();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Get contact context from request body
    const body = await request.json();
    const { contactContext } = body as { contactContext: ContactContext };

    if (!contactContext || !contactContext.name) {
      return NextResponse.json(
        { error: 'Contact context is required' },
        { status: 400 }
      );
    }

    // Generate conversation starters
    const starters = await ConversationStarterGenerator.generateStarters(contactContext);

    return NextResponse.json({
      starters,
      success: true,
    });
  } catch (error: any) {
    console.error('Generate starters API error:', error);
    
    return NextResponse.json(
      { error: 'Failed to generate conversation starters', details: error.message },
      { status: 500 }
    );
  }
}
