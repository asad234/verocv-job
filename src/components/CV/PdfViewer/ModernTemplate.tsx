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
import { format, isValid } from 'date-fns';
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

// ─── Prop Types ───────────────────────────────────────────────────
export interface ModernResumeTemplateProps {
  data: CVData;
  visibility: SectionVisibility;
  translations: DashboardTranslations;
  accentColor?: string;
  headingFont?: string;
  bodyFont?: string;
  /** Portfolio items to render at the bottom of the CV */
  portfolioItems?: PortfolioItem[];
}

// ─── Resolve the best URL for each portfolio item ─────────────────
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

  // Only return the URL if it looks valid
  if (!url) return null;
  try {
    new URL(url);
    return url;
  } catch {
    return null;
  }
}

// ─── Style factory ────────────────────────────────────────────────
function buildStyles(accent: string, hFont: string, bFont: string) {
  const titleColor = accent;
  const accentBar = accent;

  return StyleSheet.create({
    page: {
      flexDirection: 'row',
      fontFamily: bFont,
      fontSize: 10,
      backgroundColor: '#FFFFFF',
      padding: 0,
      paddingBottom: 20,
    },

    // ── Header ──────────────────────────────────────────────────
    headerContainer: {
      width: '100%',
      height: 85,
      backgroundColor: accent,
      paddingHorizontal: 30,
      paddingTop: 25,
      position: 'absolute',
      top: 0,
      left: 0,
      zIndex: 10,
    },
    headerName: {
      color: '#FFFFFF',
      fontSize: 24,
      fontFamily: hFont,
      fontWeight: 'bold',
      textTransform: 'uppercase',
      letterSpacing: 1,
      marginBottom: 4,
    },
    headerSubtitle: {
      color: 'rgba(255, 255, 255, 0.85)',
      fontFamily: bFont,
      fontSize: 10,
    },

    // ── Main Layout ─────────────────────────────────────────────
    mainContainer: {
      flexDirection: 'row',
      width: '100%',
      paddingTop: 85,
    },

    // ── Left Sidebar ────────────────────────────────────────────
    leftColumn: {
      width: '32%',
      padding: 20,
      paddingTop: 20,
      backgroundColor: '#F8FAFC',
      borderRightWidth: 1,
      borderRightColor: '#E2E8F0',
    },

    sidebarContactSection: {
      paddingBottom: 14,
      marginBottom: 2,
      borderBottomWidth: 1,
      borderBottomColor: '#E2E8F0',
    },
    sidebarContactRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: 5,
    },
    sidebarContactLabel: {
      fontSize: 7,
      color: '#64748B',
      textTransform: 'uppercase',
      letterSpacing: 0.7,
      fontFamily: hFont,
      fontWeight: 'bold',
      width: 46,
      paddingTop: 0.8,
    },
    sidebarContactValue: {
      fontSize: 8.5,
      fontFamily: bFont,
      color: '#334155',
      flex: 1,
      lineHeight: 1.4,
    },

    leftSectionTitle: {
      fontSize: 10,
      fontFamily: hFont,
      fontWeight: 'bold',
      color: titleColor,
      marginBottom: 10,
      marginTop: 15,
      textTransform: 'uppercase',
      borderBottomWidth: 2,
      borderBottomColor: accentBar,
      paddingBottom: 4,
      width: '100%',
    },

    // ── Right Column ────────────────────────────────────────────
    rightColumn: {
      width: '68%',
      padding: 30,
      paddingTop: 20,
      backgroundColor: '#FFFFFF',
    },
    rightSectionTitle: {
      fontSize: 13,
      fontFamily: hFont,
      fontWeight: 'bold',
      color: titleColor,
      marginBottom: 12,
      marginTop: 15,
      paddingBottom: 4,
      borderBottomWidth: 1,
      borderBottomColor: '#E2E8F0',
      textTransform: 'uppercase',
    },

    // ── Summary ─────────────────────────────────────────────────
    summaryText: {
      fontSize: 9.5,
      fontFamily: bFont,
      lineHeight: 1.6,
      color: '#334155',
      textAlign: 'justify',
    },

    // ── Experience / Education / Project items ───────────────────
    item: { marginBottom: 16 },
    itemHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 2,
    },
    itemDetails: { width: '75%' },
    itemDates: {
      width: '25%',
      textAlign: 'right',
      fontSize: 9,
      fontFamily: bFont,
      color: '#64748B',
    },
    itemTitle: {
      fontSize: 11,
      fontFamily: hFont,
      fontWeight: 'bold',
      color: '#334155',
    },
    itemSubtitle: {
      fontSize: 10,
      fontFamily: hFont,
      color: titleColor,
      fontWeight: 'bold',
      marginTop: 1,
    },
    itemDescription: {
      fontSize: 9.5,
      fontFamily: bFont,
      lineHeight: 1.5,
      color: '#334155',
      marginTop: 4,
    },

    // ── Skills ──────────────────────────────────────────────────
    skillItem: { marginBottom: 8 },
    skillHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 3,
    },
    skillName: {
      fontSize: 9,
      fontFamily: bFont,
      color: '#334155',
      fontWeight: 'bold',
      flex: 1,          // ← ADD: takes available space
      flexShrink: 1,    // ← ADD: shrinks instead of overflowing
      paddingRight: 4,  // ← ADD: small gap before the years label
    },
    skillBarContainer: {
      height: 4,
      width: '100%',
      backgroundColor: '#E2E8F0',
      borderRadius: 2,
    },
    skillBarFill: {
      height: '100%',
      backgroundColor: accentBar,
      borderRadius: 2,
    },

    // ── Languages ───────────────────────────────────────────────
    languageItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 6,
    },
    languageName: {
      fontSize: 9,
      fontFamily: bFont,
      color: '#334155',
    },
    dotContainer: { flexDirection: 'row' },
    dot: { width: 6, height: 6, borderRadius: 3, marginLeft: 3 },

    // ── Tags ────────────────────────────────────────────────────
    tagContainer: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 6 },
    tag: {
      backgroundColor: '#EFF6FF',
      color: titleColor,
      fontSize: 8,
      fontFamily: bFont,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 4,
      marginRight: 6,
      marginTop: 4,
      borderWidth: 0.5,
      borderColor: '#BFDBFE',
    },

    // ── Certs / Refs ─────────────────────────────────────────────
    smallItem: { marginBottom: 10 },
    smallTitle: {
      fontSize: 9.5,
      fontFamily: hFont,
      fontWeight: 'bold',
      color: '#334155',
    },
    smallMeta: {
      fontSize: 8.5,
      fontFamily: bFont,
      color: '#64748B',
      marginTop: 1,
    },

    // ── Portfolio cards ──────────────────────────────────────────
    portfolioGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
    },
    portfolioCard: {
      width: '47%',
      marginRight: '3%',
      marginBottom: 8,
      borderLeftWidth: 3,
      borderLeftColor: accentBar,
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
    portfolioCardLinkWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 2,
    },
    portfolioCardLinkPill: {
      backgroundColor: accentBar,
      borderRadius: 3,
      paddingHorizontal: 7,
      paddingVertical: 3,
    },
    portfolioCardLink: {
      fontSize: 8,
      fontFamily: bFont,
      color: '#FFFFFF',
    },
    portfolioCardLinkArrow: {
      fontSize: 8,
      fontFamily: bFont,
      color: '#FFFFFF',
      marginLeft: 2,
    },
  });
}

// ─── Main Component ───────────────────────────────────────────────
const ModernResumeTemplate = ({
  data,
  visibility,
  translations: t,
  accentColor = DEFAULT_ACCENT_COLOR,
  headingFont = DEFAULT_HEADING_FONT,
  bodyFont = DEFAULT_BODY_FONT,
  portfolioItems,
}: ModernResumeTemplateProps) => {

  const s = buildStyles(accentColor, headingFont, bodyFont);
  const pi = data.personalInfo!;

  const visiblePortfolio = (portfolioItems ?? []).filter(p => p.visible !== false);

  // ─── Helpers ──────────────────────────────────────────────────────
  const safeFormat = (date: string | Date | null | undefined, fmt: string) => {
    if (!date) return '';
    const d = new Date(date);
    return isValid(d) ? format(d, fmt) : '';
  };

  const formatDateRange = (
    startDate: string | Date | null | undefined,
    endDate?: string | Date | null,
    isOngoing?: boolean,
  ) => {
    const start = safeFormat(startDate, 'MMM yyyy');
    const end = isOngoing ? t.ongoing : safeFormat(endDate, 'MMM yyyy');
    if (!start) return '';
    return end ? `${start} - ${end}` : start;
  };

  // ── Inline skill bar ──
  const RenderSkill = ({ name, years }: { name: string; years?: number }) => {
    const percent = Math.min(100, Math.max(20, (years || 1) * 20));
    return (
      <View style={s.skillItem}>
        <View style={s.skillHeader}>
          <Text style={s.skillName}>{name}</Text>
          {years ? (
            <Text style={{ fontSize: 8, color: '#64748B', fontFamily: bodyFont }}>
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

  // ── Inline language dots ──
  const RenderLanguage = ({ language, level }: { language: string; level: string }) => {
    const l = level.toLowerCase();
    let filled = 1;
    if (l.includes('basic') || l.includes('a1') || l.includes('a2')) filled = 2;
    if (l.includes('intermediate') || l.includes('b1') || l.includes('b2')) filled = 3;
    if (l.includes('advanced') || l.includes('c1')) filled = 4;
    if (l.includes('native') || l.includes('fluent') || l.includes('c2')) filled = 5;

    return (
      <View style={s.languageItem}>
        <Text style={s.languageName}>{language}</Text>
        <View style={s.dotContainer}>
          {Array.from({ length: 5 }).map((_, i) => (
            <View
              key={i}
              style={[s.dot, { backgroundColor: i < filled ? accentColor : '#E2E8F0' }]}
            />
          ))}
        </View>
      </View>
    );
  };

  // ── Portfolio card ──
  const RenderPortfolioCard = ({ item }: { item: PortfolioItem }) => {
    const url = resolvePortfolioUrl(item);
    return (
      <View style={s.portfolioCard} wrap={false}>
        <Text style={s.portfolioCardTitle}>{item.title}</Text>
        <Text style={s.portfolioCardType}>{item.type}</Text>
        {item.description ? (
          <Text style={s.portfolioCardDescription}>
            {item.description}
          </Text>
        ) : null}
        {url ? (
          <View style={s.portfolioCardLinkWrapper}>
            <Link src={url}>
              <View style={s.portfolioCardLinkPill}>
                <Text style={s.portfolioCardLink}>Open link →</Text>
              </View>
            </Link>
          </View>
        ) : null}
      </View>
    );
  };

  return (
    <Document title={`${pi.firstName} ${pi.lastName} Resume`}>
      <Page size="A4" style={s.page} wrap>

        {/* ── Header ── */}
        {visibility.personalInfo && (
          <View style={s.headerContainer} fixed>
            <Text style={s.headerName}>{pi.firstName} {pi.lastName}</Text>
            {pi.title && <Text style={s.headerSubtitle}>{pi.title}</Text>}
          </View>
        )}

        <View style={s.mainContainer}>

          {/* ════ LEFT SIDEBAR ════ */}
          <View style={s.leftColumn}>

            {/* Contact */}
            {visibility.personalInfo && (
              <View style={s.sidebarContactSection}>
                <Text style={[s.leftSectionTitle, { marginTop: 0 }]}>{t.contactSection}</Text>
                {pi.homeAddress && (
                  <View style={s.sidebarContactRow}>
                    <Text style={s.sidebarContactLabel}>{t.homeAddressLabel}</Text>
                    <Text style={s.sidebarContactValue}>{pi.homeAddress}</Text>
                  </View>
                )}
                {pi.phoneNumber && (
                  <View style={s.sidebarContactRow}>
                    <Text style={s.sidebarContactLabel}>{t.phone}</Text>
                    <Text style={s.sidebarContactValue}>{pi.phoneNumber}</Text>
                  </View>
                )}
                {(pi.privateEmail || pi.workEmail) && (
                  <View style={s.sidebarContactRow}>
                    <Text style={s.sidebarContactLabel}>{t.email}</Text>
                    <Text style={s.sidebarContactValue}>
                      {pi.privateEmail || pi.workEmail}
                    </Text>
                  </View>
                )}
                {pi.socialLinks?.linkedIn && (
                  <View style={s.sidebarContactRow}>
                    <Text style={s.sidebarContactLabel}>LinkedIn</Text>
                    <Text style={s.sidebarContactValue}>{pi.socialLinks.linkedIn}</Text>
                  </View>
                )}
                {pi.socialLinks?.gitHub && (
                  <View style={s.sidebarContactRow}>
                    <Text style={s.sidebarContactLabel}>GitHub</Text>
                    <Text style={s.sidebarContactValue}>{pi.socialLinks.gitHub}</Text>
                  </View>
                )}
                {pi.socialLinks?.website && (
                  <View style={s.sidebarContactRow}>
                    <Text style={s.sidebarContactLabel}>{t.website}</Text>
                    <Text style={s.sidebarContactValue}>{pi.socialLinks.website}</Text>
                  </View>
                )}
              </View>
            )}

            {/* Skills */}
            {visibility.skills && (data.skills?.length ?? 0) > 0 && (
              <View wrap={false}>
                <Text style={s.leftSectionTitle}>{t.skills}</Text>
                {data.skills!
                  .filter(sk => sk.visible !== false)
                  .map((skill, i) => (
                    <RenderSkill key={i} name={skill.skillName} years={skill.skillYearsExperience} />
                  ))}
              </View>
            )}

            {/* Languages */}
            {visibility.languages && (data.languages?.length ?? 0) > 0 && (
              <View wrap={false}>
                <Text style={s.leftSectionTitle}>{t.languages}</Text>
                {data.languages!
                  .filter(l => l.visible !== false)
                  .map((lang, i) => (
                    <RenderLanguage key={i} language={lang.language} level={lang.level} />
                  ))}
              </View>
            )}

            {/* Certifications */}
            {visibility.certifications && (data.certifications?.length ?? 0) > 0 && (
              <View>
                <Text style={s.leftSectionTitle}>{t.certifications}</Text>
                {data.certifications!
                  .filter(c => c.visible !== false)
                  .map((cert, i) => (
                    <View key={i} style={s.smallItem} wrap={false}>
                      <Text style={s.smallTitle}>{cert.title}</Text>
                      <Text style={s.smallMeta}>{cert.issuer}</Text>
                      <Text style={s.smallMeta}>
                        {(() => {
                          const start = safeFormat(cert.startDate, 'MMM yyyy');
                          const end = cert.noExpiry
                            ? 'Does not expire'
                            : safeFormat(cert.validDate, 'MMM yyyy');
                          if (start && end) return `${start} – ${end}`;
                          return start || end || '';
                        })()}
                      </Text>
                    </View>
                  ))}
              </View>
            )}

            {/* References */}
            {visibility.references && (data.references?.length ?? 0) > 0 && (
              <View>
                <Text style={s.leftSectionTitle}>{t.references}</Text>
                {data.references!
                  .filter(r => r.visible !== false)
                  .map((ref, i) => (
                    <View key={i} style={s.smallItem} wrap={false}>
                      <Text style={s.smallTitle}>{ref.firstName} {ref.lastName}</Text>
                      <Text style={s.smallMeta}>{ref.positionTitle}</Text>
                      <Text style={s.smallMeta}>{ref.company}</Text>
                    </View>
                  ))}
              </View>
            )}
          </View>

          {/* ════ RIGHT CONTENT ════ */}
          <View style={s.rightColumn}>

            {/* Profile summary */}
            {visibility.personalInfo && pi.professionalPresentation && (
              <View wrap={false}>
                <Text style={[s.rightSectionTitle, { marginTop: 0 }]}>{t.profileSection}</Text>
                <Text style={s.summaryText}>{pi.professionalPresentation}</Text>
              </View>
            )}

            {/* Experience */}
            {visibility.experience && (data.experience?.length ?? 0) > 0 && (
              <View>
                <Text style={s.rightSectionTitle}>{t.experienceSection}</Text>
                {data.experience!
                  .filter(e => e.visible !== false)
                  .map((job) => (
                    <View key={job.id} style={s.item} wrap={false}>
                      <View style={s.itemHeader}>
                        <View style={s.itemDetails}>
                          <Text style={s.itemTitle}>{job.title}</Text>
                          <Text style={s.itemSubtitle}>{job.employer}</Text>
                        </View>
                        <Text style={s.itemDates}>
                          {formatDateRange(job.startDate, job.endDate, job.ongoing)}
                        </Text>
                      </View>
                      {job.description && (
                        <Text style={s.itemDescription}>{job.description}</Text>
                      )}
                    </View>
                  ))}
              </View>
            )}

            {/* Projects */}
            {visibility.projects && (data.projects?.length ?? 0) > 0 && (
              <View>
                <Text style={s.rightSectionTitle}>{t.projects}</Text>
                {data.projects!
                  .filter(p => p.visible !== false)
                  .map((proj) => (
                    <View key={proj.id} style={s.item} wrap={false}>
                      <View style={s.itemHeader}>
                        <View style={s.itemDetails}>
                          <Text style={s.itemTitle}>{proj.role}</Text>
                          <Text style={s.itemSubtitle}>
                            {proj.company ? `${t.clientLabel} ${proj.company}` : t.personalProject}
                          </Text>
                        </View>
                        <Text style={s.itemDates}>
                          {formatDateRange(proj.startDate, proj.endDate, proj.isCurrent)}
                        </Text>
                      </View>
                      {proj.description && (
                        <Text style={s.itemDescription}>{proj.description}</Text>
                      )}
                      {proj.skills && (
                        <View style={s.tagContainer}>
                          {proj.skills.split(',').map((skill, i) => (
                            <Text key={i} style={s.tag}>{skill.trim()}</Text>
                          ))}
                        </View>
                      )}
                    </View>
                  ))}
              </View>
            )}

            {/* Education */}
            {visibility.education && (data.education?.length ?? 0) > 0 && (
              <View>
                <Text style={s.rightSectionTitle}>{t.educationSection}</Text>
                {data.education!
                  .filter(e => e.visible !== false)
                  .map((edu) => (
                    <View key={edu.id} style={s.item} wrap={false}>
                      <View style={s.itemHeader}>
                        <View style={s.itemDetails}>
                          <Text style={s.itemTitle}>{edu.program}</Text>
                          <Text style={s.itemSubtitle}>
                            {edu.school}{edu.place ? ` - ${edu.place}` : ''}
                          </Text>
                        </View>
                        <Text style={s.itemDates}>
                          {formatDateRange(edu.startDate, edu.endDate, edu.ongoing)}
                        </Text>
                      </View>
                      {edu.description && (
                        <Text style={s.itemDescription}>{edu.description}</Text>
                      )}
                    </View>
                  ))}
              </View>
            )}

            {/* ── Portfolio ── */}
            {visibility.portfolios !== false && visiblePortfolio.length > 0 && (
              <View>
                <Text style={s.rightSectionTitle}>{t.portfolios}</Text>
                <View style={s.portfolioGrid}>
                  {visiblePortfolio.map((item) => (
                    <RenderPortfolioCard key={item.id} item={item} />
                  ))}
                </View>
              </View>
            )}

          </View>
        </View>
      </Page>
    </Document>
  );
};

export default ModernResumeTemplate;
