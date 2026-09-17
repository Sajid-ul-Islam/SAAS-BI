import { NextRequest, NextResponse } from 'next/server';
import { aiService, QuotaExceededError } from '@/modules/ai/ai.service';
import { askAiQuerySchema } from '@/modules/ai/ai.schema';
import { resolveActiveTenantId } from '@/lib/tenant-context';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const tenantId = await resolveActiveTenantId();
    const body = await req.json();

    const parseResult = askAiQuerySchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: 'Invalid query input',
          details: parseResult.error.format(),
        },
        { status: 400 }
      );
    }

    const { query } = parseResult.data;
    const conversationHistory = Array.isArray(body.conversationHistory) ? body.conversationHistory : undefined;
    const shouldStream = req.nextUrl.searchParams.get('stream') === 'true' || Boolean(body.stream);
    const result = await aiService.executeQuery(tenantId, query, undefined, conversationHistory);


    if (shouldStream) {
      const encoder = new TextEncoder();
      const chunks = result.answer.split(' ');
      const stream = new ReadableStream({
        async start(controller) {
          for (let i = 0; i < chunks.length; i++) {
            const word = chunks[i] + (i < chunks.length - 1 ? ' ' : '');
            const payload = JSON.stringify({
              chunk: word,
              cached: result.cached,
              tokensUsed: result.tokensUsed,
            });
            controller.enqueue(encoder.encode(`data: ${payload}\n\n`));
            await new Promise((r) => setTimeout(r, 15));
          }
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        },
      });

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream; charset=utf-8',
          'Cache-Control': 'no-cache, no-transform',
          Connection: 'keep-alive',
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    if (error instanceof QuotaExceededError) {
      return NextResponse.json(
        {
          error: 'QuotaExceeded',
          message: error.message,
        },
        { status: 429 }
      );
    }

    logger.error('Failed to execute AI query', { error });
    return NextResponse.json(
      {
        error: 'InternalServerError',
        message: 'Failed to process AI query. Please try again.',
      },
      { status: 500 }
    );
  }
}
