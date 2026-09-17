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
    const result = await aiService.executeQuery(tenantId, query);

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
