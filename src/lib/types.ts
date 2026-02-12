export interface User {
  id: string
  email: string
  created_at: string
  subscription_plan: 'free' | 'discovery' | 'pro' | 'unlimited'
  analyses_count: number
  analyses_limit: number
  trial_ends_at: string | null
}

export interface Analysis {
  id: string
  user_id: string
  filename: string
  file_type: 'pdf' | 'docx'
  global_score: number
  summary: string
  red_flags: string[]
  positive_points: string[]
  created_at: string
}

export interface Clause {
  id: string
  analysis_id: string
  type: string
  found: boolean
  risk_level: 'critique' | 'attention' | 'ok' | 'absent'
  original_text: string | null
  explanation: string
  recommendation: string
  suggested_rewrite: string | null
}

export const PLANS = {
  free: { name: 'Essai gratuit', price: 0, analyses: 1, duration: '7 jours' },
  discovery: { name: 'Découverte', price: 12, analyses: 3, duration: 'mois' },
  pro: { name: 'Pro', price: 19, analyses: 10, duration: 'mois' },
  unlimited: { name: 'Illimité', price: 29, analyses: -1, duration: 'mois' },
} as const

export type PlanType = keyof typeof PLANS