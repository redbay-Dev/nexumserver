import { z } from 'zod';

export const CompanyRegisterSchema = z.object({
  company_name: z.string().min(2).max(255),
  admin_email: z.string().email(),
  admin_phone: z.string().optional(),
  subscription_tier: z.enum(['standard', 'professional', 'enterprise']).optional().default('standard')
});

export const CompanyValidateSchema = z.object({
  company_code: z.string().min(8).max(10),
  machine_id: z.string().min(32).max(64),
  hostname: z.string().max(255)
});

export const HeartbeatSchema = z.object({
  company_code: z.string().min(8).max(10),
  machine_id: z.string().min(32).max(64),
  app_version: z.string().max(20)
});

export const UpdateCheckSchema = z.object({
  version: z.string(),
  channel: z.enum(['stable', 'beta', 'alpha']).optional().default('stable'),
  company_code: z.string().min(8).max(10)
});

export type CompanyRegister = z.infer<typeof CompanyRegisterSchema>;
export type CompanyValidate = z.infer<typeof CompanyValidateSchema>;
export type Heartbeat = z.infer<typeof HeartbeatSchema>;
export type UpdateCheck = z.infer<typeof UpdateCheckSchema>;