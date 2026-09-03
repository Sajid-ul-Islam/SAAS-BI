import { z } from 'zod';
import { TenantRole } from '@prisma/client';

export const createTenantSchema = z.object({
  name: z.string().min(2).max(255),
  slug: z
    .string()
    .min(2)
    .max(100)
    .regex(/^[a-z0-9-]+$/, 'Slug must only contain lowercase alphanumeric characters and dashes'),
});

export const inviteMemberSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2).max(255),
  role: z.nativeEnum(TenantRole).default(TenantRole.MEMBER),
});

export type CreateTenantInput = z.infer<typeof createTenantSchema>;
export type InviteMemberInput = z.infer<typeof inviteMemberSchema>;
