export type CompanyPlanId = 'TRIAL' | 'PRO' | 'BUSINESS'

export function companyPlanLabel(plan?: string | null): string {
  if (plan === 'PRO') return 'Pro'
  if (plan === 'BUSINESS') return 'Empresa'
  return 'Free'
}
