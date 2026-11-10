'use client';

import React from 'react';
import {
  Page,
  Document,
  StyleSheet,
  View,
  Text,
  Link,
} from '@react-pdf/renderer';
import { format } from 'date-fns';
import { CVData, SectionVisibility } from '@/utils/types';
import {
  registerCvFonts,
  DEFAULT_HEADING_FONT,
  DEFAULT_BODY_FONT,
  DEFAULT_ACCENT_COLOR,
} from './Cvfontregistry';
import { DashboardTranslations } from '@/utils/dashboardTranslations';

registerCvFonts();

// ─── Portfolio item type ───────────────────────────────────────────
export interface PortfolioItem {
  id: string;
  type: 'image' | 'video' | 'youtube' | 'link' | 'document';
  title: string;
  description?: string;
  visible?: boolean;
  imageUrl?: string;
  videoUrl?: string;
  youtubeUrl?: string;
  youtubeVideoId?: string;
  linkUrl?: string;
  documentUrl?: string;
  documentName?: string;
}

function resolvePortfolioUrl(item: PortfolioItem): string | null {
  let url: string | null | undefined;
  switch (item.type) {
    case 'image': url = item.imageUrl; break;
    case 'video': url = item.videoUrl; break;
    case 'youtube':
      url = item.youtubeVideoId
        ? `https://www.youtube.com/watch?v=${item.youtubeVideoId}`
        : item.youtubeUrl;
      break;
    case 'link': url = item.linkUrl; break;
    case 'document': url = item.documentUrl; break;
    default: url = null;
  }
  if (!url) return null;
  try { new URL(url); return url; } catch { return null; }
}

// ─── Prop Types ───────────────────────────────────────────────────
export interface ClassicResumeTemplateProps {
  data: CVData;
  visibility: SectionVisibility;
  accentColor?: string;
  headingFont?: string;
  bodyFont?: string;
  translations: DashboardTranslations;
  portfolioItems?: PortfolioItem[];
}

// ─── Style factory ────────────────────────────────────────────────
function buildStyles(accent: string, hFont: string, bFont: string) {
  return StyleSheet.create({
    page: {
      fontFamily: bFont,
      fontSize: 10,
      backgroundColor: '#FFFFFF',
      paddingTop: 35,
      paddingBottom: 35,
      paddingHorizontal: 40,
      flexDirection: 'row',
    },

    leftColumn: {
      width: '65%',
      paddingRight: 25,
    },
    rightColumn: {
      width: '35%',
      paddingLeft: 15,
      borderLeftWidth: 1,
      borderLeftColor: '#E2E8F0',
    },

    header: { marginBottom: 20 },
    headerName: {
      fontSize: 22,
      fontFamily: hFont,
      fontWeight: 'bold',
      color: accent,
      marginBottom: 6,
      letterSpacing: 0.5,
    },
    headerTitle: {
      fontSize: 11,
      fontFamily: hFont,
      color: '#475569',
      marginBottom: 4,
    },
    contactInfo: {
      fontSize: 8.5,
      fontFamily: bFont,
      color: '#64748B',
      lineHeight: 1.4,
    },
    contactLine: { marginBottom: 1 },

    section: { marginBottom: 18 },
    sectionTitle: {
      fontSize: 9,
      fontFamily: hFont,
      fontWeight: 'bold',
      color: accent,
      textTransform: 'uppercase',
      letterSpacing: 1.5,
      marginBottom: 8,
      paddingBottom: 3,
      borderBottomWidth: 1.5,
      borderBottomColor: accent,
    },

    profileText: {
      fontSize: 9.5,
      fontFamily: bFont,
      lineHeight: 1.6,
      color: '#334155',
      textAlign: 'justify',
    },

    entryItem: { marginBottom: 12 },
    entryTitle: {
      fontSize: 10.5,
      fontFamily: hFont,
      fontWeight: 'bold',
      color: '#1E293B',
      marginBottom: 2,
    },
    entrySubtitle: {
      fontSize: 9.5,
      fontFamily: hFont,
      color: accent,
      marginBottom: 2,
    },
    entryMeta: {
      fontSize: 9,
      fontFamily: bFont,
      color: '#64748B',
      marginBottom: 4,
    },
    entryDescription: {
      fontSize: 9.5,
      fontFamily: bFont,
      lineHeight: 1.5,
      color: '#334155',
    },

    projectBox: { marginBottom: 12, paddingBottom: 8 },
    projectTitle: {
      fontSize: 10,
      fontFamily: hFont,
      fontWeight: 'bold',
      color: '#1E293B',
      marginBottom: 2,
    },
    projectSubtitle: {
      fontSize: 9.5,
      fontFamily: hFont,
      color: accent,
      marginBottom: 2,
    },
    projectMeta: {
      fontSize: 9,
      fontFamily: bFont,
      color: '#64748B',
      marginBottom: 3,
    },
    projectDescription: {
      fontSize: 9,
      fontFamily: bFont,
      lineHeight: 1.4,
      color: '#334155',
    },
    tagContainer: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 4 },
    tag: {
      fontSize: 7.5,
      fontFamily: bFont,
      color: accent,
      backgroundColor: '#F1F5F9',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 3,
      marginRight: 4,
      marginTop: 3,
      borderWidth: 0.5,
      borderColor: '#CBD5E1',
    },

    sidebarSection: { marginBottom: 20 },
    sidebarTitle: {
      fontSize: 9,
      fontFamily: hFont,
      fontWeight: 'bold',
      color: accent,
      textTransform: 'uppercase',
      letterSpacing: 1.2,
      marginBottom: 8,
      paddingBottom: 3,
      borderBottomWidth: 1.5,
      borderBottomColor: accent,
    },

    skillItem: { marginBottom: 7 },
    skillName: {
      fontSize: 9,
      fontFamily: bFont,
      fontWeight: 'bold',
      color: '#334155',
      marginBottom: 3,
    },
    skillBarContainer: {
      height: 3,
      width: '100%',
      backgroundColor: '#E2E8F0',
      borderRadius: 2,
    },
    skillBarFill: {
      height: '100%',
      backgroundColor: accent,
      borderRadius: 2,
    },

    languageItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 6,
    },
    languageName: { fontSize: 9, fontFamily: bFont, color: '#334155' },
    languageLevel: { fontSize: 8, fontFamily: bFont, color: '#64748B' },
    dotContainer: { flexDirection: 'row' },
    dot: { width: 6, height: 6, borderRadius: 3, marginLeft: 3 },

    certBox: { marginBottom: 10 },
    certTitle: {
      fontSize: 9.5,
      fontFamily: hFont,
      fontWeight: 'bold',
      color: '#1E293B',
      marginBottom: 2,
    },
    certMeta: {
      fontSize: 8.5,
      fontFamily: bFont,
      color: '#64748B',
      marginTop: 1,
    },

    referenceBox: { marginBottom: 10 },
    referenceName: {
      fontSize: 9.5,
      fontFamily: hFont,
      fontWeight: 'bold',
      color: '#1E293B',
      marginBottom: 2,
    },
    referenceDetail: {
      fontSize: 8.5,
      fontFamily: bFont,
      color: '#64748B',
      lineHeight: 1.3,
    },
    referencePosition: {
      fontSize: 8.5,
      fontFamily: bFont,
      color: accent,
      marginBottom: 1,
    },

    // ── Portfolio ────────────────────────────────────────────────
    portfolioGrid: { flexDirection: 'row', flexWrap: 'wrap' },
    portfolioCard: {
      width: '47%',
      marginRight: '3%',
      marginBottom: 8,
      borderLeftWidth: 3,
      borderLeftColor: accent,
      backgroundColor: '#F8FAFC',
      borderTopRightRadius: 4,
      borderBottomRightRadius: 4,
      paddingHorizontal: 8,
      paddingVertical: 7,
    },
    portfolioCardTitle: {
      fontSize: 9.5,
      fontFamily: hFont,
      fontWeight: 'bold',
      color: '#1E293B',
      marginBottom: 2,
    },
    portfolioCardType: {
      fontSize: 7.5,
      fontFamily: bFont,
      color: '#64748B',
      textTransform: 'capitalize',
      marginBottom: 5,
    },
    portfolioCardDescription: {
      fontSize: 8,
      fontFamily: bFont,
      color: '#475569',
      lineHeight: 1.4,
      marginBottom: 5,
    },
    portfolioCardLinkPill: {
      backgroundColor: accent,
      borderRadius: 3,
      paddingHorizontal: 7,
      paddingVertical: 3,
      alignSelf: 'flex-start',
    },
    portfolioCardLink: {
      fontSize: 8,
      fontFamily: bFont,
      color: '#FFFFFF',
    },
  });
}

// ─── Helpers ──────────────────────────────────────────────────────
const safeFormat = (date: Date | string | null | undefined) => {
  if (!date) return '';
  try { return format(new Date(date), 'MMM yyyy'); } catch { return ''; }
};

// ─── Main Component ───────────────────────────────────────────────
const ClassicResumeTemplate = ({
  data,
  visibility,
  translations: t,
  accentColor = DEFAULT_ACCENT_COLOR,
  headingFont = DEFAULT_HEADING_FONT,
  bodyFont = DEFAULT_BODY_FONT,
  portfolioItems,
}: ClassicResumeTemplateProps) => {
  const s = buildStyles(accentColor, headingFont, bodyFont);
  const pi = data.personalInfo;

  const formatDateRange = (
    startDate: Date | string | null | undefined,
    endDate?: Date | string | null,
    isOngoing?: boolean,
  ) => {
    const start = safeFormat(startDate);
    const end = isOngoing ? t.ongoing : safeFormat(endDate);
    if (!start) return '';
    return end ? `${start} - ${end}` : start;
  };

  const visibleExperience = data.experience?.filter(e => e.visible !== false) ?? [];
  const visibleProjects = data.projects?.filter(p => p.visible !== false) ?? [];
  const visibleEducation = data.education?.filter(e => e.visible !== false) ?? [];
  const visibleSkills = data.skills?.filter(s => s.visible !== false) ?? [];
  const visibleLanguages = data.languages?.filter(l => l.visible !== false) ?? [];
  const visibleCertifications = data.certifications?.filter(c => c.visible !== false) ?? [];
  const visibleReferences = data.references?.filter(r => r.visible !== false) ?? [];
  const visiblePortfolio = (portfolioItems ?? []).filter(p => p.visible !== false);

  const RenderSkill = ({ name, years }: { name: string; years?: number }) => {
    const percent = Math.min(100, Math.max(20, (years || 1) * 20));
    return (
      <View style={s.skillItem}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 }}>
          <Text style={s.skillName}>{name}</Text>
          {years ? (
            <Text style={{ fontSize: 7.5, color: '#64748B', fontFamily: bodyFont }}>
              {years}+ {t.years}
            </Text>
          ) : null}
        </View>
        <View style={s.skillBarContainer}>
          <View style={[s.skillBarFill, { width: `${percent}%` }]} />
        </View>
      </View>
    );
  };

  const RenderLanguage = ({ language, level }: { language: string; level: string }) => {
    const l = level.toLowerCase();
    let filled = 1;
    if (l.includes('basic') || l.includes('a1') || l.includes('a2')) filled = 2;
    if (l.includes('intermediate') || l.includes('b1') || l.includes('b2')) filled = 3;
    if (l.includes('advanced') || l.includes('c1')) filled = 4;
    if (l.includes('native') || l.includes('fluent') || l.includes('c2')) filled = 5;
    return (
      <View style={s.languageItem}>
        <View>
          <Text style={s.languageName}>{language}</Text>
          <Text style={s.languageLevel}>{level}</Text>
        </View>
        <View style={s.dotContainer}>
          {Array.from({ length: 5 }).map((_, i) => (
            <View key={i} style={[s.dot, { backgroundColor: i < filled ? accentColor : '#E2E8F0' }]} />
          ))}
        </View>
      </View>
    );
  };

  const RenderPortfolioCard = ({ item }: { item: PortfolioItem }) => {
    const url = resolvePortfolioUrl(item);
    return (
      <View style={s.portfolioCard} wrap={false}>
        <Text style={s.portfolioCardTitle}>{item.title}</Text>
        <Text style={s.portfolioCardType}>{item.type}</Text>
        {item.description ? (
          <Text style={s.portfolioCardDescription}>{item.description}</Text>
        ) : null}
        {url ? (
          <Link src={url}>
            <View style={s.portfolioCardLinkPill}>
              <Text style={s.portfolioCardLink}>Open link →</Text>
            </View>
          </Link>
        ) : null}
      </View>
    );
  };

  return (
    <Document title={`${pi?.firstName || 'Resume'} ${pi?.lastName || ''}`}>
      <Page size="A4" style={s.page} wrap>

        {/* ════ LEFT COLUMN ════ */}
        <View style={s.leftColumn}>

          {/* Header */}
          {visibility.personalInfo && pi && (
            <View style={s.header}>
              <Text style={s.headerName}>{pi.firstName} {pi.lastName}</Text>
              {pi.title && <Text style={s.headerTitle}>{pi.title}</Text>}
              <View style={s.contactInfo}>
                {pi.homeAddress && <Text style={s.contactLine}>{pi.homeAddress}</Text>}
                <Text style={s.contactLine}>
                  {(pi.privateEmail || pi.workEmail) ? `${pi.privateEmail || pi.workEmail}` : ''}
                  {(pi.privateEmail || pi.workEmail) && pi.phoneNumber ? ' • ' : ''}
                  {pi.phoneNumber ?? ''}
                </Text>
                {(pi.socialLinks?.linkedIn || pi.socialLinks?.gitHub || pi.socialLinks?.website) && (
                  <Text style={s.contactLine}>
                    {[pi.socialLinks?.linkedIn, pi.socialLinks?.gitHub, pi.socialLinks?.website]
                      .filter(Boolean).join(' • ')}
                  </Text>
                )}
              </View>
            </View>
          )}

          {/* Profile Summary */}
          {visibility.personalInfo && pi?.professionalPresentation && (
            <View style={s.section} wrap={false}>
              <Text style={s.sectionTitle}>{t.profileSection}</Text>
              <Text style={s.profileText}>{pi.professionalPresentation}</Text>
            </View>
          )}

          {/* Work Experience */}
          {visibility.experience && visibleExperience.length > 0 && (
            <View style={s.section}>
              <Text style={s.sectionTitle}>{t.experienceSection}</Text>
              {visibleExperience.map((job) => (
                <View key={job.id} style={s.entryItem} wrap={false}>
                  <Text style={s.entryTitle}>{job.title}</Text>
                  <Text style={s.entrySubtitle}>{job.employer}</Text>
                  <Text style={s.entryMeta}>
                    {formatDateRange(job.startDate, job.endDate, job.ongoing)}
                  </Text>
                  {job.description && <Text style={s.entryDescription}>{job.description}</Text>}
                </View>
              ))}
            </View>
          )}

          {/* Projects */}
          {visibility.projects && visibleProjects.length > 0 && (
            <View style={s.section}>
              <Text style={s.sectionTitle}>{t.projects}</Text>
              {visibleProjects.map((project) => (
                <View key={project.id} style={s.projectBox} wrap={false}>
                  <Text style={s.projectTitle}>{project.role}</Text>
                  <Text style={s.projectSubtitle}>
                    {project.company ? `${t.clientLabel} ${project.company}` : t.personalProject}
                  </Text>
                  <Text style={s.projectMeta}>
                    {formatDateRange(project.startDate, project.endDate, project.isCurrent)}
                  </Text>
                  {project.description && <Text style={s.projectDescription}>{project.description}</Text>}
                  {project.skills && (
                    <View style={s.tagContainer}>
                      {project.skills.split(',').map((skill, i) => (
                        <Text key={i} style={s.tag}>{skill.trim()}</Text>
                      ))}
                    </View>
                  )}
                </View>
              ))}
            </View>
          )}

          {/* Education */}
          {visibility.education && visibleEducation.length > 0 && (
            <View style={s.section}>
              <Text style={s.sectionTitle}>{t.educationSection}</Text>
              {visibleEducation.map((edu) => (
                <View key={edu.id} style={s.entryItem} wrap={false}>
                  <Text style={s.entryTitle}>{edu.program}</Text>
                  <Text style={s.entrySubtitle}>{edu.school}{edu.place ? ` — ${edu.place}` : ''}</Text>
                  <Text style={s.entryMeta}>
                    {formatDateRange(edu.startDate, edu.endDate, edu.ongoing)}
                  </Text>
                  {edu.description && <Text style={s.entryDescription}>{edu.description}</Text>}
                </View>
              ))}
            </View>
          )}

          {/* References */}
          {visibility.references && visibleReferences.length > 0 && (
            <View style={s.section}>
              <Text style={s.sectionTitle}>{t.references}</Text>
              {visibleReferences.map((ref) => (
                <View key={ref.id} style={s.referenceBox} wrap={false}>
                  <Text style={s.referenceName}>{ref.firstName} {ref.lastName}</Text>
                  <Text style={s.referencePosition}>{ref.positionTitle}</Text>
                  <Text style={s.referenceDetail}>{ref.company}</Text>
                  {ref.email && <Text style={s.referenceDetail}>{ref.email}</Text>}
                  {ref.phoneNumber && <Text style={s.referenceDetail}>{ref.phoneNumber}</Text>}
                </View>
              ))}
            </View>
          )}

          {/* ── Portfolio ── */}
          {visibility.portfolios !== false && visiblePortfolio.length > 0 && (
            <View style={s.section}>
              <Text style={s.sectionTitle}>{t.portfolios}</Text>
              <View style={s.portfolioGrid}>
                {visiblePortfolio.map((item) => (
                  <RenderPortfolioCard key={item.id} item={item} />
                ))}
              </View>
            </View>
          )}

        </View>

        {/* ════ RIGHT COLUMN (SIDEBAR) ════ */}
        <View style={s.rightColumn}>

          {/* Skills */}
          {visibility.skills && visibleSkills.length > 0 && (
            <View style={s.sidebarSection} wrap={false}>
              <Text style={s.sidebarTitle}>{t.skills}</Text>
              {visibleSkills.map((skill, i) => (
                <RenderSkill key={skill.id ?? i} name={skill.skillName} years={skill.skillYearsExperience} />
              ))}
            </View>
          )}

          {/* Languages */}
          {visibility.languages && visibleLanguages.length > 0 && (
            <View style={s.sidebarSection} wrap={false}>
              <Text style={s.sidebarTitle}>{t.languages}</Text>
              {visibleLanguages.map((lang, i) => (
                <RenderLanguage key={lang.id ?? i} language={lang.language} level={lang.level} />
              ))}
            </View>
          )}

          {/* Certifications */}
          {visibility.certifications && visibleCertifications.length > 0 && (
            <View style={s.sidebarSection}>
              <Text style={s.sidebarTitle}>{t.certifications}</Text>
              {visibleCertifications.map((cert, i) => (
                <View key={cert.id ?? i} style={s.certBox} wrap={false}>
                  <Text style={s.certTitle}>{cert.title}</Text>
                  <Text style={s.certMeta}>{cert.issuer}</Text>
                  <Text style={s.certMeta}>
                    {(() => {
                      const start = safeFormat(cert.startDate);
                      const end = cert.noExpiry ? 'No expiry' : safeFormat(cert.validDate);
                      if (start && end) return `${start} – ${end}`;
                      return start || end || '';
                    })()}
                  </Text>
                </View>
              ))}
            </View>
          )}

        </View>
      </Page>
    </Document>
  );
};

export default ClassicResumeTemplate;
