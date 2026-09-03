import { describe, it, expect } from 'vitest';
import { aiService } from '../../src/modules/ai/ai.service';

describe('AI Cost Discipline & Prompt Hashing', () => {
  const tenantId = '00000000-0000-0000-0000-000000000001';

  it('computes consistent deterministic SHA-256 hashes for identical prompt context', () => {
    const hash1 = aiService.computePromptHash(tenantId, 'Why did returns spike?', 'ctx_hash_123');
    const hash2 = aiService.computePromptHash(tenantId, 'Why did returns spike?', 'ctx_hash_123');
    expect(hash1).toBe(hash2);
    expect(hash1).toHaveLength(64);
  });

  it('normalizes prompt casing and whitespace', () => {
    const hash1 = aiService.computePromptHash(tenantId, '  Why did returns spike?  ', 'ctx_hash_123');
    const hash2 = aiService.computePromptHash(tenantId, 'why did returns spike?', 'ctx_hash_123');
    expect(hash1).toBe(hash2);
  });

  it('produces different hashes for different tenants with same prompt', () => {
    const otherTenantId = '99999999-9999-9999-9999-999999999999';
    const hash1 = aiService.computePromptHash(tenantId, 'Show sales', 'ctx');
    const hash2 = aiService.computePromptHash(otherTenantId, 'Show sales', 'ctx');
    expect(hash1).not.toBe(hash2);
  });
});
