'use client';

import React from 'react';
import { Page, Document, StyleSheet, View, Text, Link } from '@react-pdf/renderer';
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

export interface KonsultResumeTemplateProps {
  data: CVData;
  visibility: SectionVisibility;
  accentColor?: string;
  headingFont?: string;
  bodyFont?: string;
  translations: DashboardTranslations;
  portfolioItems?: PortfolioItem[];
}

function buildStyles(accent: string, hFont: string, bFont: string) {
  const TEXT_DARK = '#111827';
  const TEXT_MID = '#374151';
  const TEXT_LIGHT = '#6B7280';
  const DIVIDER = '#E5E7EB';

  return StyleSheet.create({
    page: { fontFamily: bFont, fontSize: 10, color: TEXT_DARK, backgroundColor: '#FFFFFF', paddingTop: 36, paddingBottom: 48, paddingHorizontal: 56, lineHeight: 1.55 },
    header: { marginBottom: 26, alignItems: 'center' },
    headerNameLarge: { fontFamily: hFont, fontWeight: 'bold', fontSize: 28, color: TEXT_DARK, letterSpacing: 0.5, marginBottom: 10 },
    headerTitle: { fontFamily: hFont, fontWeight: 'bold', fontSize: 12, color: accent, letterSpacing: 0.3, marginTop: 10, marginBottom: 12 },
    headerDivider: { alignSelf: 'stretch', borderBottomColor: accent, marginTop: 8, marginBottom: 4, height: 0.5 },
    contactRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' },
    contactItem: { fontFamily: bFont, fontSize: 9, color: TEXT_MID, marginLeft: 5, marginRight: 5, marginBottom: 3 },
    contactSep: { fontFamily: bFont, fontSize: 9, color: TEXT_LIGHT, marginBottom: 3 },
    section: { marginBottom: 20 },
    sectionHeading: { fontFamily: hFont, fontWeight: 'bold', fontSize: 10, color: accent, textTransform: 'uppercase', letterSpacing: 1.4, marginBottom: 5 },
    rule: { borderBottomWidth: 0.75, borderBottomColor: DIVIDER, marginBottom: 10 },
    profileText: { fontFamily: bFont, fontSize: 9.5, color: TEXT_MID, lineHeight: 1.7, textAlign: 'justify' },
    techBlock: { fontFamily: hFont, fontWeight: 'bold', fontSize: 9.5, color: TEXT_DARK, lineHeight: 1.65, textAlign: 'justify' },
    projectItem: { marginBottom: 16, paddingBottom: 16, borderBottomWidth: 0.5, borderBottomColor: DIVIDER },
    projectItemLast: { marginBottom: 0, paddingBottom: 0 },
    projectCompany: { fontFamily: hFont, fontWeight: 'bold', fontSize: 11, color: TEXT_DARK, marginBottom: 3 },
    projectMeta: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
    projectRole: { fontFamily: bFont, fontSize: 9.5, color: accent, marginRight: 8 },
    projectDot: { fontFamily: bFont, fontSize: 9, color: TEXT_LIGHT, marginRight: 8 },
    projectDate: { fontFamily: bFont, fontSize: 9, color: TEXT_LIGHT },
    projectDesc: { fontFamily: bFont, fontSize: 9, color: TEXT_MID, lineHeight: 1.65, textAlign: 'justify', marginBottom: 6 },
    projectTechLabel: { fontFamily: hFont, fontWeight: 'bold', fontSize: 8.5, color: TEXT_DARK, marginBottom: 2 },
    projectTechValue: { fontFamily: bFont, fontSize: 8.5, color: TEXT_MID, lineHeight: 1.55 },
    expItem: { marginBottom: 14 },
    expTitle: { fontFamily: hFont, fontWeight: 'bold', fontSize: 10.5, color: TEXT_DARK, marginBottom: 2 },
    expEmployer: { fontFamily: bFont, fontSize: 9.5, color: accent, marginBottom: 2 },
    expDate: { fontFamily: bFont, fontSize: 8.5, color: TEXT_LIGHT, marginBottom: 4 },
    expDesc: { fontFamily: bFont, fontSize: 9, color: TEXT_MID, lineHeight: 1.65 },
    eduItem: { marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    eduLeft: { flex: 1, paddingRight: 12 },
    eduProgram: { fontFamily: hFont, fontWeight: 'bold', fontSize: 9.5, color: TEXT_DARK, marginBottom: 2 },
    eduSchool: { fontFamily: bFont, fontSize: 9, color: TEXT_MID },
    eduDate: { fontFamily: bFont, fontSize: 8.5, color: TEXT_LIGHT, textAlign: 'right' },
    certItem: { marginBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    certLeft: { flex: 1, paddingRight: 12 },
    certTitle: { fontFamily: hFont, fontWeight: 'bold', fontSize: 9.5, color: TEXT_DARK, marginBottom: 2 },
    certIssuer: { fontFamily: bFont, fontSize: 9, color: TEXT_MID },
    certDate: { fontFamily: bFont, fontSize: 8.5, color: TEXT_LIGHT, textAlign: 'right' },
    langRow: { flexDirection: 'row', flexWrap: 'wrap' },
    langItem: { fontFamily: bFont, fontSize: 9, color: TEXT_MID, marginRight: 14, marginBottom: 4 },
    langLevel: { color: TEXT_LIGHT },
    refGrid: { flexDirection: 'row', flexWrap: 'wrap' },
    refItem: { width: '48%', marginRight: '2%', marginBottom: 10 },
    refName: { fontFamily: hFont, fontWeight: 'bold', fontSize: 9.5, color: TEXT_DARK, marginBottom: 2 },
    refRole: { fontFamily: bFont, fontSize: 8.5, color: TEXT_MID, marginBottom: 1 },
    refContact: { fontFamily: bFont, fontSize: 8.5, color: TEXT_LIGHT },

    // ── Portfolio ────────────────────────────────────────────────
    portfolioGrid: { flexDirection: 'row', flexWrap: 'wrap' },
    portfolioCard: {
      width: '47%',
      marginRight: '3%',
      marginBottom: 8,
      borderLeftWidth: 3,
      borderLeftColor: accent,
      backgroundColor: '#F9FAFB',
      borderTopRightRadius: 4,
      borderBottomRightRadius: 4,
      paddingHorizontal: 8,
      paddingVertical: 7,
    },
    portfolioCardTitle: {
      fontFamily: hFont,
      fontWeight: 'bold',
      fontSize: 9.5,
      color: TEXT_DARK,
      marginBottom: 2,
    },
    portfolioCardType: {
      fontFamily: bFont,
      fontSize: 7.5,
      color: TEXT_LIGHT,
      textTransform: 'capitalize',
      marginBottom: 4,
    },
    portfolioCardDescription: {
      fontFamily: bFont,
      fontSize: 8,
      color: TEXT_MID,
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
      fontFamily: bFont,
      fontSize: 8,
      color: '#FFFFFF',
    },
  });
}

const safeFormat = (date: Date | string | null | undefined): string => {
  if (!date) return '';
  try { return format(new Date(date), 'MMM yyyy'); } catch { return ''; }
};

const KonsultResumeTemplate = ({
  data,
  visibility,
  translations: t,
  accentColor = DEFAULT_ACCENT_COLOR,
  headingFont = DEFAULT_HEADING_FONT,
  bodyFont = DEFAULT_BODY_FONT,
  portfolioItems,
}: KonsultResumeTemplateProps) => {

  const s = buildStyles(accentColor, headingFont, bodyFont);
  const pi = data.personalInfo;

  const dateRange = (
    start: Date | string | null | undefined,
    end?: Date | string | null,
    ongoing?: boolean,
  ): string => {
    const a = safeFormat(start);
    const b = ongoing ? t.ongoing : safeFormat(end);
    if (!a && !b) return '';
    if (!b) return a;
    if (!a) return b;
    return `${a} – ${b}`;
  };

  const visibleProjects = (data.projects ?? []).filter(p => p.visible !== false);
  const visibleExperience = (data.experience ?? []).filter(e => e.visible !== false);
  const visibleSkills = (data.skills ?? []).filter(sk => sk.visible !== false);
  const visibleEducation = (data.education ?? []).filter(e => e.visible !== false);
  const visibleCertifications = (data.certifications ?? []).filter(c => c.visible !== false);
  const visibleLanguages = (data.languages ?? []).filter(l => l.visible !== false);
  const visibleReferences = (data.references ?? []).filter(r => r.visible !== false);
  const visiblePortfolio = (portfolioItems ?? []).filter(p => p.visible !== false);

  const summary = pi?.professionalPresentation || (pi as any)?.personalPresentation || '';
  const techList = visibleSkills.map(sk => sk.skillName).filter(Boolean).join(', ');
  const fullName = [pi?.firstName, pi?.lastName].filter(Boolean).join(' ');

  const contactFields = [
    pi?.homeAddress,
    pi?.privateEmail || pi?.workEmail,
    pi?.phoneNumber,
    pi?.socialLinks?.linkedIn,
    pi?.socialLinks?.gitHub,
    pi?.socialLinks?.website,
  ].filter(Boolean) as string[];

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
    <Document title={`${fullName} – ${t.konsultCvTitle}`}>
      <Page size="A4" style={s.page}>

        {/* Header */}
        {pi && (
          <View style={s.header}>
            <Text style={s.headerNameLarge}>{fullName}</Text>
            {pi.title ? <Text style={s.headerTitle}>{pi.title}</Text> : null}
            <View style={s.headerDivider} />
            <View style={s.contactRow}>
              {contactFields.map((item, idx) => (
                <React.Fragment key={idx}>
                  <Text style={s.contactItem}>{item}</Text>
                  {idx < contactFields.length - 1 ? <Text style={s.contactSep}>•</Text> : null}
                </React.Fragment>
              ))}
            </View>
          </View>
        )}

        {/* Profile */}
        {summary !== '' && (
          <View style={s.section} wrap={false}>
            <Text style={s.sectionHeading}>{t.profileSection}</Text>
            <View style={s.rule} />
            <Text style={s.profileText}>{summary}</Text>
          </View>
        )}

        {/* Tech in focus */}
        {visibility.skills !== false && visibleSkills.length > 0 && (
          <View style={s.section} wrap={false}>
            <Text style={s.sectionHeading}>{t.techFocus}</Text>
            <View style={s.rule} />
            <Text style={s.techBlock}>{techList}</Text>
          </View>
        )}

        {/* Reference Projects */}
        {visibility.projects !== false && visibleProjects.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionHeading}>{t.referenceProjects}</Text>
            <View style={s.rule} />
            {visibleProjects.map((proj, idx) => {
              const isLast = idx === visibleProjects.length - 1;
              return (
                <View key={proj.id} style={isLast ? s.projectItemLast : s.projectItem} wrap={false}>
                  <Text style={s.projectCompany}>{proj.company || proj.role}</Text>
                  <View style={s.projectMeta}>
                    {proj.company ? <Text style={s.projectRole}>{proj.role}</Text> : null}
                    {proj.company ? <Text style={s.projectDot}>·</Text> : null}
                    <Text style={s.projectDate}>{dateRange(proj.startDate, proj.endDate, proj.isCurrent)}</Text>
                  </View>
                  {proj.description ? <Text style={s.projectDesc}>{proj.description}</Text> : null}
                  {proj.skills ? (
                    <View>
                      <Text style={s.projectTechLabel}>{t.technologiesLabel}:</Text>
                      <Text style={s.projectTechValue}>{proj.skills}</Text>
                    </View>
                  ) : null}
                </View>
              );
            })}
          </View>
        )}

        {/* Work Experience */}
        {visibility.experience !== false && visibleExperience.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionHeading}>{t.workExperience}</Text>
            <View style={s.rule} />
            {visibleExperience.map((job) => (
              <View key={job.id} style={s.expItem} wrap={false}>
                <Text style={s.expTitle}>{job.title}</Text>
                <Text style={s.expEmployer}>{job.employer}</Text>
                <Text style={s.expDate}>{dateRange(job.startDate, job.endDate, job.ongoing)}</Text>
                {job.description ? <Text style={s.expDesc}>{job.description}</Text> : null}
              </View>
            ))}
          </View>
        )}

        {/* Education */}
        {visibility.education !== false && visibleEducation.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionHeading}>{t.educationSection}</Text>
            <View style={s.rule} />
            {visibleEducation.map((edu) => (
              <View key={edu.id} style={s.eduItem} wrap={false}>
                <View style={s.eduLeft}>
                  <Text style={s.eduProgram}>{edu.program}{edu.level ? ` – ${edu.level}` : ''}</Text>
                  <Text style={s.eduSchool}>{edu.school}{edu.place ? `, ${edu.place}` : ''}</Text>
                </View>
                <Text style={s.eduDate}>{dateRange(edu.startDate, edu.endDate, edu.ongoing)}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Certifications */}
        {visibility.certifications !== false && visibleCertifications.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionHeading}>{t.certifications}</Text>
            <View style={s.rule} />
            {visibleCertifications.map((cert) => (
              <View key={cert.id} style={s.certItem} wrap={false}>
                <View style={s.certLeft}>
                  <Text style={s.certTitle}>{cert.title}</Text>
                  <Text style={s.certIssuer}>{cert.issuer}</Text>
                </View>
                <Text style={s.certDate}>
                  {safeFormat(cert.startDate)}
                  {!cert.noExpiry && cert.validDate ? ` – ${safeFormat(cert.validDate)}` : ''}
                  {cert.noExpiry ? ` (${t.doesntExpire})` : ''}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Languages */}
        {visibility.languages !== false && visibleLanguages.length > 0 && (
          <View style={s.section} wrap={false}>
            <Text style={s.sectionHeading}>{t.languages}</Text>
            <View style={s.rule} />
            <View style={s.langRow}>
              {visibleLanguages.map((lang) => (
                <Text key={lang.id} style={s.langItem}>
                  {lang.language}{' '}
                  <Text style={s.langLevel}>({lang.level})</Text>
                </Text>
              ))}
            </View>
          </View>
        )}

        {/* References */}
        {visibility.references !== false && visibleReferences.length > 0 && (
          <View style={s.section} wrap={false}>
            <Text style={s.sectionHeading}>{t.references}</Text>
            <View style={s.rule} />
            <View style={s.refGrid}>
              {visibleReferences.map((ref) => (
                <View key={ref.id} style={s.refItem}>
                  <Text style={s.refName}>{ref.firstName} {ref.lastName}</Text>
                  <Text style={s.refRole}>{ref.positionTitle}{ref.company ? ` · ${ref.company}` : ''}</Text>
                  {ref.email ? <Text style={s.refContact}>{ref.email}</Text> : null}
                  {ref.phoneNumber ? <Text style={s.refContact}>{ref.phoneNumber}</Text> : null}
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ── Portfolio ── */}
        {visibility.portfolios !== false && visiblePortfolio.length > 0 && (
          <View style={s.section} wrap={false}>
            <Text style={s.sectionHeading}>{t.portfolios}</Text>
            <View style={s.rule} />
            <View style={s.portfolioGrid}>
              {visiblePortfolio.map((item) => (
                <RenderPortfolioCard key={item.id} item={item} />
              ))}
            </View>
          </View>
        )}

      </Page>
    </Document>
  );
};

export default KonsultResumeTemplate;
