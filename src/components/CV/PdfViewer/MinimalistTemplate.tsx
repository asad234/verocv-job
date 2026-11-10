'use client';

import { CVData, SectionVisibility } from '@/utils/types';
import { Document, Page, Text, View, StyleSheet, Link } from '@react-pdf/renderer';
import { format } from 'date-fns';
import {
  registerCvFonts,
  DEFAULT_HEADING_FONT,
  DEFAULT_BODY_FONT,
  DEFAULT_ACCENT_COLOR,
} from './Cvfontregistry';
import { DashboardTranslations } from '@/utils/dashboardTranslations';

registerCvFonts();

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

export interface MinimalistResumeTemplateProps {
  data: CVData;
  visibility: SectionVisibility;
  accentColor?: string;
  headingFont?: string;
  bodyFont?: string;
  sidebarColor?: string;
  translations: DashboardTranslations;
  portfolioItems?: PortfolioItem[];
}

function buildStyles(accent: string, hFont: string, bFont: string, sidebarBg: string) {
  return StyleSheet.create({
    page: {
      fontFamily: bFont,
      fontSize: 9,
      backgroundColor: '#FFFFFF',
      paddingTop: 25,
      paddingBottom: 25,
      paddingHorizontal: 30,
      flexDirection: 'row',
    },
    leftColumn: {
      width: '35%',
      backgroundColor: sidebarBg,
      paddingLeft: 15,
      paddingRight: 18,
      paddingTop: 15,
      paddingBottom: 15,
      marginLeft: -30,
      marginTop: -25,
      marginBottom: -25,
    },
    rightColumn: {
      width: '65%',
      paddingLeft: 20,
    },
    header: {
      marginBottom: 15,
      paddingBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: 'rgba(255,255,255,0.2)',
    },
    headerName: {
      fontSize: 18,
      fontFamily: hFont,
      fontWeight: 'bold',
      color: '#FFFFFF',
      marginBottom: 3,
      lineHeight: 1.2,
    },
    headerTitle: {
      fontSize: 9.5,
      fontFamily: bFont,
      color: 'rgba(255,255,255,0.75)',
    },
    sidebarSection: { marginBottom: 14 },
    sidebarTitle: {
      fontSize: 8,
      fontFamily: hFont,
      fontWeight: 'bold',
      color: '#FFFFFF',
      textTransform: 'uppercase',
      letterSpacing: 1.2,
      marginBottom: 6,
      paddingBottom: 3,
      borderBottomWidth: 1,
      borderBottomColor: 'rgba(255,255,255,0.25)',
    },
    sidebarItem: {
      fontSize: 8.5,
      fontFamily: bFont,
      color: 'rgba(255,255,255,0.85)',
      marginBottom: 4,
      lineHeight: 1.4,
    },
    contactItem: {
      fontSize: 8,
      fontFamily: bFont,
      color: 'rgba(255,255,255,0.75)',
      marginBottom: 3,
      lineHeight: 1.3,
    },
    skillItem: { marginBottom: 7 },
    skillName: {
      fontSize: 8.5,
      fontFamily: bFont,
      color: '#FFFFFF',
      marginBottom: 3,
      flex: 1,
      flexShrink: 1,
      paddingRight: 4,
    },
    skillBarContainer: {
      height: 3,
      width: '100%',
      backgroundColor: 'rgba(255,255,255,0.2)',
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
    languageName: {
      fontSize: 8.5,
      fontFamily: bFont,
      color: 'rgba(255,255,255,0.85)',
    },
    languageLevel: {
      fontSize: 7.5,
      fontFamily: bFont,
      color: 'rgba(255,255,255,0.55)',
      marginTop: 1,
    },
    dotContainer: { flexDirection: 'row' },
    dot: { width: 5, height: 5, borderRadius: 3, marginLeft: 3 },
    section: { marginBottom: 12 },
    sectionTitle: {
      fontSize: 9,
      fontFamily: hFont,
      fontWeight: 'bold',
      color: accent,
      textTransform: 'uppercase',
      letterSpacing: 1,
      marginBottom: 6,
      paddingBottom: 3,
      borderBottomWidth: 1,
      borderBottomColor: accent,
    },
    profileText: {
      fontSize: 8.5,
      fontFamily: bFont,
      lineHeight: 1.5,
      color: '#334155',
      textAlign: 'justify',
    },
    entryItem: { marginBottom: 8 },
    entryHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: 1,
    },
    // ── View wrapper: this is the fix — constrains text to 70% so date never overlaps ──
    entryTitleWrapper: {
      width: '70%',
      paddingRight: 4,
    },
    entryTitle: {
      fontSize: 9.5,
      fontFamily: hFont,
      fontWeight: 'bold',
      color: '#1E293B',
    },
    entryDate: {
      width: '30%',
      fontSize: 7.5,
      fontFamily: bFont,
      color: '#64748B',
      textAlign: 'right',
    },
    entrySubtitle: {
      fontSize: 8.5,
      fontFamily: bFont,
      color: accent,
      marginBottom: 2,
    },
    entryDescription: {
      fontSize: 8,
      fontFamily: bFont,
      lineHeight: 1.4,
      color: '#475569',
    },
    projectBox: { marginBottom: 8 },
    tagContainer: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 3 },
    tag: {
      fontSize: 7,
      fontFamily: bFont,
      color: accent,
      backgroundColor: '#F1F5F9',
      paddingHorizontal: 5,
      paddingVertical: 1.5,
      borderRadius: 3,
      marginRight: 3,
      marginTop: 2,
      borderWidth: 0.5,
      borderColor: '#CBD5E1',
    },
    certBox: { marginBottom: 6 },
    certTitle: {
      fontSize: 9,
      fontFamily: hFont,
      fontWeight: 'bold',
      color: '#1E293B',
      marginBottom: 1,
    },
    certMeta: {
      fontSize: 8,
      fontFamily: bFont,
      color: '#64748B',
      marginTop: 1,
    },
    referenceBox: { marginBottom: 6 },
    referenceName: {
      fontSize: 9,
      fontFamily: hFont,
      fontWeight: 'bold',
      color: '#1E293B',
      marginBottom: 1,
    },
    referencePosition: {
      fontSize: 8,
      fontFamily: bFont,
      color: accent,
      marginBottom: 1,
    },
    referenceDetail: {
      fontSize: 7.5,
      fontFamily: bFont,
      color: '#64748B',
      lineHeight: 1.3,
    },
    portfolioGrid: { flexDirection: 'row', flexWrap: 'wrap' },
    portfolioCard: {
      width: '47%',
      marginRight: '3%',
      marginBottom: 7,
      borderLeftWidth: 3,
      borderLeftColor: accent,
      backgroundColor: '#F8FAFC',
      borderTopRightRadius: 4,
      borderBottomRightRadius: 4,
      paddingHorizontal: 7,
      paddingVertical: 6,
    },
    portfolioCardTitle: {
      fontSize: 9,
      fontFamily: hFont,
      fontWeight: 'bold',
      color: '#1E293B',
      marginBottom: 2,
    },
    portfolioCardType: {
      fontSize: 7,
      fontFamily: bFont,
      color: '#64748B',
      textTransform: 'capitalize',
      marginBottom: 4,
    },
    portfolioCardDescription: {
      fontSize: 7.5,
      fontFamily: bFont,
      color: '#475569',
      lineHeight: 1.4,
      marginBottom: 4,
    },
    portfolioCardLinkPill: {
      backgroundColor: accent,
      borderRadius: 3,
      paddingHorizontal: 6,
      paddingVertical: 2,
      alignSelf: 'flex-start',
    },
    portfolioCardLink: {
      fontSize: 7.5,
      fontFamily: bFont,
      color: '#FFFFFF',
    },
  });
}

const formatDate = (date?: Date | string | null) => {
  if (!date) return '';
  try { return format(new Date(date), 'MMM yyyy'); } catch { return ''; }
};

const MinimalistResumeTemplate = ({
  data,
  visibility,
  translations: t,
  accentColor = DEFAULT_ACCENT_COLOR,
  headingFont = DEFAULT_HEADING_FONT,
  bodyFont = DEFAULT_BODY_FONT,
  sidebarColor = '#172A45',
  portfolioItems,
}: MinimalistResumeTemplateProps) => {
  const s = buildStyles(accentColor, headingFont, bodyFont, sidebarColor);
  const pi = data.personalInfo;

  const renderDateRange = (
    startDate: Date | string | null | undefined,
    endDate?: Date | string | null,
    isOngoing?: boolean,
  ) => {
    const start = formatDate(startDate);
    const end = isOngoing ? t.ongoing : formatDate(endDate);
    if (!start) return '';
    return end ? `${start} - ${end}` : start;
  };

  const activeSkills = data.skills?.filter(sk => sk.visible !== false) ?? [];
  const activeLanguages = data.languages?.filter(l => l.visible !== false) ?? [];
  const activeExperience = data.experience?.filter(e => e.visible !== false) ?? [];
  const activeProjects = data.projects?.filter(p => p.visible !== false) ?? [];
  const activeEducation = data.education?.filter(e => e.visible !== false) ?? [];
  const activeCertifications = data.certifications?.filter(c => c.visible !== false) ?? [];
  const activeReferences = data.references?.filter(r => r.visible !== false) ?? [];
  const visiblePortfolio = (portfolioItems ?? []).filter(p => p.visible !== false);

  const RenderSkill = ({ name, years }: { name: string; years?: number }) => {
    const percent = Math.min(100, Math.max(20, (years || 1) * 20));
    return (
      <View style={s.skillItem}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 }}>
          <Text style={s.skillName}>{name}</Text>
          {years ? (
            <Text style={{ fontSize: 7, color: 'rgba(255,255,255,0.55)', fontFamily: bodyFont, flexShrink: 0 }}>
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
            <View key={i} style={[s.dot, { backgroundColor: i < filled ? accentColor : 'rgba(255,255,255,0.2)' }]} />
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
    <Document title={`${pi?.firstName || 'Resume'} ${pi?.lastName || ''} CV`.trim()}>
      <Page size="A4" style={s.page} wrap>

        {/* ════ LEFT SIDEBAR ════ */}
        <View style={s.leftColumn}>
          {visibility.personalInfo && pi && (
            <View style={s.header}>
              <Text style={s.headerName}>{pi.firstName} {pi.lastName}</Text>
              {pi.title && <Text style={s.headerTitle}>{pi.title}</Text>}
            </View>
          )}
          {visibility.personalInfo && pi && (
            <View style={s.sidebarSection}>
              <Text style={s.sidebarTitle}>{t.contactSection}</Text>
              {pi.homeAddress && <Text style={s.contactItem}>{pi.homeAddress}</Text>}
              {pi.phoneNumber && <Text style={s.contactItem}>{pi.phoneNumber}</Text>}
              {(pi.privateEmail || pi.workEmail) && (
                <Text style={s.contactItem}>{pi.privateEmail || pi.workEmail}</Text>
              )}
              {pi.socialLinks?.linkedIn && <Text style={s.contactItem}>{pi.socialLinks.linkedIn}</Text>}
              {pi.socialLinks?.gitHub && <Text style={s.contactItem}>{pi.socialLinks.gitHub}</Text>}
              {pi.socialLinks?.website && <Text style={s.contactItem}>{pi.socialLinks.website}</Text>}
            </View>
          )}
          {visibility.skills && activeSkills.length > 0 && (
            <View style={s.sidebarSection} wrap={false}>
              <Text style={s.sidebarTitle}>{t.skills}</Text>
              {activeSkills.map((skill, i) => (
                <RenderSkill key={skill.id ?? i} name={skill.skillName} years={skill.skillYearsExperience} />
              ))}
            </View>
          )}
          {visibility.languages && activeLanguages.length > 0 && (
            <View style={s.sidebarSection} wrap={false}>
              <Text style={s.sidebarTitle}>{t.languages}</Text>
              {activeLanguages.map((lang, i) => (
                <RenderLanguage key={lang.id ?? i} language={lang.language} level={lang.level} />
              ))}
            </View>
          )}
        </View>

        {/* ════ RIGHT CONTENT ════ */}
        <View style={s.rightColumn}>
          {visibility.personalInfo && pi?.professionalPresentation && (
            <View style={s.section} wrap={false}>
              <Text style={s.sectionTitle}>{t.profileSection}</Text>
              <Text style={s.profileText}>{pi.professionalPresentation}</Text>
            </View>
          )}

          {/* Experience */}
          {visibility.experience && activeExperience.length > 0 && (
            <View style={s.section}>
              <Text style={s.sectionTitle}>{t.experienceSection}</Text>
              {activeExperience.map((emp) => (
                <View key={emp.id} style={s.entryItem} wrap={false}>
                  <View style={s.entryHeader}>
                    <View style={s.entryTitleWrapper}>
                      <Text style={s.entryTitle}>{emp.title}</Text>
                    </View>
                    <Text style={s.entryDate}>
                      {renderDateRange(emp.startDate, emp.endDate, emp.ongoing)}
                    </Text>
                  </View>
                  <Text style={s.entrySubtitle}>{emp.employer}</Text>
                  {emp.description && <Text style={s.entryDescription}>{emp.description}</Text>}
                </View>
              ))}
            </View>
          )}

          {/* Projects */}
          {visibility.projects && activeProjects.length > 0 && (
            <View style={s.section}>
              <Text style={s.sectionTitle}>{t.projects}</Text>
              {activeProjects.map((p) => (
                <View key={p.id} style={s.projectBox} wrap={false}>
                  <View style={s.entryHeader}>
                    <View style={s.entryTitleWrapper}>
                      <Text style={s.entryTitle}>{p.role}</Text>
                    </View>
                    <Text style={s.entryDate}>
                      {renderDateRange(p.startDate, p.endDate, p.isCurrent)}
                    </Text>
                  </View>
                  <Text style={s.entrySubtitle}>
                    {p.company ? `${t.clientLabel} ${p.company}` : t.personalProject}
                  </Text>
                  {p.description && <Text style={s.entryDescription}>{p.description}</Text>}
                  {p.skills && (
                    <View style={s.tagContainer}>
                      {p.skills.split(',').map((skill, i) => (
                        <Text key={i} style={s.tag}>{skill.trim()}</Text>
                      ))}
                    </View>
                  )}
                </View>
              ))}
            </View>
          )}

          {/* Education */}
          {visibility.education && activeEducation.length > 0 && (
            <View style={s.section}>
              <Text style={s.sectionTitle}>{t.educationSection}</Text>
              {activeEducation.map((edu) => (
                <View key={edu.id} style={s.entryItem} wrap={false}>
                  <View style={s.entryHeader}>
                    <View style={s.entryTitleWrapper}>
                      <Text style={s.entryTitle}>{edu.program}</Text>
                    </View>
                    <Text style={s.entryDate}>
                      {renderDateRange(edu.startDate, edu.endDate, edu.ongoing)}
                    </Text>
                  </View>
                  <Text style={s.entrySubtitle}>
                    {edu.school}{edu.place ? ` — ${edu.place}` : ''}
                  </Text>
                  {edu.description && <Text style={s.entryDescription}>{edu.description}</Text>}
                </View>
              ))}
            </View>
          )}

          {visibility.certifications && activeCertifications.length > 0 && (
            <View style={s.section}>
              <Text style={s.sectionTitle}>{t.certifications}</Text>
              {activeCertifications.map((cert) => (
                <View key={cert.id} style={s.certBox} wrap={false}>
                  <Text style={s.certTitle}>{cert.title}</Text>
                  <Text style={s.certMeta}>{cert.issuer}</Text>
                  <Text style={s.certMeta}>
                    {(() => {
                      const start = formatDate(cert.startDate);
                      const end = cert.noExpiry ? 'No expiry' : formatDate(cert.validDate);
                      if (start && end) return `${start} – ${end}`;
                      return start || end || '';
                    })()}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {visibility.references && activeReferences.length > 0 && (
            <View style={s.section}>
              <Text style={s.sectionTitle}>{t.references}</Text>
              {activeReferences.map((ref) => (
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

          {/* Portfolio */}
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
      </Page>
    </Document>
  );
};

export default MinimalistResumeTemplate;
