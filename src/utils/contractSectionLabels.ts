import type { SectionKey } from './contractsStore'

/** Section headings as printed in the finished contract (neutral wording). */
export const CONTRACT_SECTION_LABELS: Record<SectionKey, { en: string; sv: string }> = {
  agreementTitle: { en: 'Agreement Title', sv: 'Avtalstitel' },
  position: { en: 'Position', sv: 'Befattning' },
  jobDuties: { en: 'Job Duties', sv: 'Arbetsuppgifter' },
  mainWorkplace: { en: 'Main Workplace', sv: 'Huvudsaklig arbetsplats' },
  workingHours: { en: 'Working Hours', sv: 'Arbetstid' },
  salary: { en: 'Salary', sv: 'Lön' },
  overtime: { en: 'Overtime', sv: 'Övertid' },
  vacation: { en: 'Vacation', sv: 'Semester' },
  socialSecurity: { en: 'Social Security', sv: 'Socialt skydd' },
  pensionInsurance: { en: 'Pension & Insurance', sv: 'Pension och försäkringar' },
  companyPolicy: { en: 'Company Policy', sv: 'Företagets policyer och regelverk' },
  bonusProgram: { en: 'Bonus Program', sv: 'Bonusprogram' },
  termination: { en: 'Termination', sv: 'Uppsägning och avslut av anställning' },
  confidentiality: { en: 'Confidentiality & Loyalty', sv: 'Sekretess och lojalitet' },
  dataProtection: { en: 'Data Protection', sv: 'Behandling av personuppgifter' },
  advanceVacationPay: { en: 'Advance Vacation', sv: 'Förskottssemester' },
  other: { en: 'Other', sv: 'Övrigt' },
}
