export interface CommissionConsultant {
  commission_system: string | null;
  has_company: boolean | null;
  accumulated_12m: number | null;
  is_team_member: boolean | null;
}

export interface CommissionInput {
  saleValue: number;
  commissionPct: number;
  sideFraction: number;
  referralPct: number;
  consultant: CommissionConsultant;
}

export interface CommissionResult {
  totalCommission: number;
  agencySide: number;
  referralAmount: number;
  agencyAfterReferral: number;
  systemLabel: string;
  effectivePct: number;
  agentAmount: number;
  agencyNet: number;
}

function getRAPPTier(accumulated: number): { pct: number; label: string } {
  if (accumulated < 25000) return { pct: 40, label: 'RAPP 40%' };
  if (accumulated < 50000) return { pct: 48, label: 'RAPP 48%' };
  return { pct: 50, label: 'RAPP 50%' };
}

function getTraineeTier(accumulated: number): { pct: number; label: string } {
  if (accumulated < 25000) return { pct: 30, label: 'Trainee 30%' };
  if (accumulated < 50000) return { pct: 35, label: 'Trainee 35%' };
  return { pct: 40, label: 'Trainee 40%' };
}

function getPUROTier(hasCompany: boolean): { pct: number; label: string } {
  return hasCompany
    ? { pct: 72.8, label: 'PURO 72.8%' }
    : { pct: 70, label: 'PURO 70%' };
}

export function calculateCommission(input: CommissionInput): CommissionResult {
  const { saleValue, commissionPct, sideFraction, referralPct, consultant } = input;

  // L1
  const totalCommission = saleValue * commissionPct / 100;

  // L2
  const agencySide = totalCommission * sideFraction;
  const referralAmount = agencySide * referralPct / 100;
  const agencyAfterReferral = agencySide - referralAmount;

  // L3 — determine system
  const accumulated = consultant.accumulated_12m ?? 0;
  let tier: { pct: number; label: string };

  if (consultant.is_team_member) {
    tier = getTraineeTier(accumulated);
  } else {
    const system = (consultant.commission_system || 'RAPP').toUpperCase();
    if (system === 'PURO') {
      tier = getPUROTier(!!consultant.has_company);
    } else {
      tier = getRAPPTier(accumulated);
    }
  }

  // L4
  const agentAmount = agencyAfterReferral * tier.pct / 100;
  const agencyNet = agencyAfterReferral - agentAmount;

  return {
    totalCommission: Math.round(totalCommission * 100) / 100,
    agencySide: Math.round(agencySide * 100) / 100,
    referralAmount: Math.round(referralAmount * 100) / 100,
    agencyAfterReferral: Math.round(agencyAfterReferral * 100) / 100,
    systemLabel: tier.label,
    effectivePct: tier.pct,
    agentAmount: Math.round(agentAmount * 100) / 100,
    agencyNet: Math.round(agencyNet * 100) / 100,
  };
}
