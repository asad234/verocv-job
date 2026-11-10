'use client';

import React from 'react';
import {
  Page,
  Document,
  StyleSheet,
  View,
  Text,
  Font,
} from '@react-pdf/renderer';
import { format } from 'date-fns';
import { CVData, SectionVisibility } from '@/utils/types';

// Register Fonts
Font.register({
  family: 'Helvetica-Bold',
  src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-bold-webfont.ttf',
});

const TEXT_PRIMARY = '#0F172A';
const TEXT_SECONDARY = '#475569';
const TEXT_META = '#94A3B8';
const DIVIDER_COLOR = '#CBD5E1';
const PAGE_BG = '#FFFFFF';

const DEFAULT_ACCENT = '#334155';

function buildStyles(accent: string) {
  return StyleSheet.create({
    page: {
      fontFamily: 'Helvetica',
      fontSize: 10,
      backgroundColor: PAGE_BG,
      paddingTop: 45,
      paddingBottom: 45,
      paddingHorizontal: 55,
    },
    header: {
      marginBottom: 32,
      alignItems: 'center',
    },
    headerName: {
      fontSize: 28,
      fontFamily: 'Helvetica-Bold',
      color: accent,
      letterSpacing: 0.5,
      marginBottom: 6,
    },
    headerTitle: {
      fontSize: 12,
      color: accent,
      fontFamily: 'Helvetica-Bold',
      letterSpacing: 0.3,
      marginBottom: 10,
    },
    headerDivider: {
      width: 80,
      height: 2,
      backgroundColor: accent,
      marginVertical: 10,
    },
    contactInfo: {
      fontSize: 9,
      color: TEXT_SECONDARY,
      lineHeight: 1.7,
      textAlign: 'center',
    },
    contactLine: {
      marginBottom: 2,
    },
    contactSeparator: {
      color: TEXT_META,
      marginHorizontal: 4,
    },
    section: {
      marginBottom: 24,
    },
    sectionLast: {
      marginBottom: 0,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    sectionAccent: {
      width: 4,
      height: 18,
      backgroundColor: accent,
      marginRight: 10,
    },
    sectionTitle: {
      fontSize: 12,
      fontFamily: 'Helvetica-Bold',
      color: accent,
      textTransform: 'uppercase',
      letterSpacing: 1.8,
    },
    sectionDivider: {
      width: '100%',
      height: 0.5,
      backgroundColor: DIVIDER_COLOR,
      marginTop: 8,
      marginBottom: 4,
    },
    summaryText: {
      fontSize: 10,
      lineHeight: 1.75,
      color: TEXT_PRIMARY,
      textAlign: 'justify',
      marginTop: 10,
      paddingHorizontal: 4,
    },
    entryItem: {
      marginBottom: 18,
      marginTop: 8,
      paddingLeft: 4,
    },
    entryItemLast: {
      marginBottom: 0,
      marginTop: 8,
      paddingLeft: 4,
    },
    entryTitleRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 5,
    },
    entryTitle: {
      fontSize: 11.5,
      fontFamily: 'Helvetica-Bold',
      color: accent,
      maxWidth: '70%',
    },
    entryDate: {
      fontSize: 9,
      color: accent,
      fontFamily: 'Helvetica-Bold',
      letterSpacing: 0.2,
    },
    entrySubtitle: {
      fontSize: 10.5,
      color: TEXT_PRIMARY,
      marginBottom: 3,
    },
    entryLocation: {
      fontSize: 9,
      color: TEXT_META,
      fontStyle: 'italic',
      marginBottom: 8,
    },
    entryDescription: {
      fontSize: 9.5,
      lineHeight: 1.65,
      color: TEXT_SECONDARY,
      textAlign: 'justify',
      marginTop: 2,
    },
    skillsList: {
      marginTop: 10,
      paddingLeft: 4,
    },
    skillsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
    },
    skillItem: {
      fontSize: 9.5,
      color: TEXT_PRIMARY,
      marginRight: 24,
      marginBottom: 7,
      paddingLeft: 12,
    },
    skillBullet: {
      position: 'absolute',
      left: 0,
      color: accent,
      fontSize: 8,
    },
    projectItem: {
      marginBottom: 18,
      marginTop: 8,
      paddingLeft: 4,
    },
    projectItemLast: {
      marginBottom: 0,
      marginTop: 8,
      paddingLeft: 4,
    },
    projectTitleRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 5,
    },
    projectTitle: {
      fontSize: 11.5,
      fontFamily: 'Helvetica-Bold',
      color: accent,
      maxWidth: '70%',
    },
    projectCompany: {
      fontSize: 10.5,
      color: TEXT_PRIMARY,
      marginBottom: 3,
    },
    projectDate: {
      fontSize: 9,
      color: accent,
      fontFamily: 'Helvetica-Bold',
      letterSpacing: 0.2,
    },
    projectDescription: {
      fontSize: 9.5,
      lineHeight: 1.65,
      color: TEXT_SECONDARY,
      textAlign: 'justify',
      marginTop: 2,
    },
    certSection: {
      marginBottom: 24,
    },
    certItem: {
      marginBottom: 14,
      marginTop: 8,
      paddingLeft: 4,
    },
    certItemLast: {
      marginBottom: 0,
      marginTop: 8,
      paddingLeft: 4,
    },
    certTitle: {
      fontSize: 10.5,
      fontFamily: 'Helvetica-Bold',
      color: accent,
      marginBottom: 4,
    },
    certDetailsRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    certIssuer: {
      fontSize: 9.5,
      color: TEXT_SECONDARY,
    },
    certDot: {
      color: TEXT_META,
      marginHorizontal: 6,
    },
    certDate: {
      fontSize: 9,
      color: accent,
      fontFamily: 'Helvetica-Bold',
    },
    languagesList: {
      marginTop: 10,
      paddingLeft: 4,
    },
    languagesRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
    },
    languageItem: {
      fontSize: 9.5,
      color: TEXT_PRIMARY,
      marginRight: 24,
      marginBottom: 7,
    },
    languageLevel: {
      color: TEXT_SECONDARY,
    },
    referenceItem: {
      marginBottom: 16,
      marginTop: 8,
      paddingLeft: 4,
    },
    referenceItemLast: {
      marginBottom: 0,
      marginTop: 8,
      paddingLeft: 4,
    },
    referenceName: {
      fontSize: 11,
      fontFamily: 'Helvetica-Bold',
      color: accent,
      marginBottom: 4,
    },
    referenceTitle: {
      fontSize: 9.5,
      color: TEXT_PRIMARY,
      marginBottom: 3,
    },
    referenceContactRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    referenceContact: {
      fontSize: 9,
      color: TEXT_SECONDARY,
    },
    referenceSeparator: {
      color: TEXT_META,
      marginHorizontal: 6,
    },
  });
}

const safeFormat = (date: Date | string | null | undefined) => {
  if (!date) return '';
  try { return format(new Date(date), 'MMM yyyy'); } catch { return ''; }
};

const formatDateRange = (startDate: Date | string | null | undefined, endDate?: Date | string | null, isOngoing?: boolean) => {
  const start = safeFormat(startDate);
  const end = isOngoing ? 'Present' : safeFormat(endDate);
  if (!start) return '';
  if (!end) return start;
  return `${start} - ${end}`;
};

const ATSResumeTemplate = ({
  data,
  visibility,
  accentColor = DEFAULT_ACCENT,
}: {
  data: CVData;
  visibility: SectionVisibility;
  accentColor?: string;
}) => {
  const styles = buildStyles(accentColor);
  const pi = data.personalInfo;

  const visibleExperience = data.experience?.filter(e => e.visible !== false) || [];
  const visibleProjects = data.projects?.filter(p => p.visible !== false) || [];
  const visibleEducation = data.education?.filter(e => e.visible !== false) || [];
  const visibleSkills = data.skills?.filter(s => s.visible !== false) || [];
  const visibleLanguages = data.languages?.filter(l => l.visible !== false) || [];
  const visibleCertifications = data.certifications?.filter(c => c.visible !== false) || [];
  const visibleReferences = data.references?.filter(r => r.visible !== false) || [];

  return (
    <Document title={`${pi?.firstName || 'Resume'} ${pi?.lastName || ''} - ATS`}>
      <Page size="A4" style={styles.page}>
        {/* --- HEADER --- */}
        {visibility.personalInfo && pi && (
          <View style={styles.header}>
            <Text style={styles.headerName}>{pi.firstName} {pi.lastName}</Text>
            {pi.title && <Text style={styles.headerTitle}>{pi.title}</Text>}
            <View style={styles.headerDivider} />
            <View style={styles.contactInfo}>
              {pi.homeAddress && <Text style={styles.contactLine}>{pi.homeAddress}</Text>}
              <Text style={styles.contactLine}>
                {(pi.privateEmail || pi.workEmail) && `${pi.privateEmail || pi.workEmail}`}
                {(pi.privateEmail || pi.workEmail) && pi.phoneNumber && (
                  <Text style={styles.contactSeparator}>•</Text>
                )}
                {pi.phoneNumber && `${pi.phoneNumber}`}
              </Text>
            </View>
          </View>
        )}

        {/* --- SUMMARY --- */}
        {visibility.personalInfo && pi?.professionalPresentation && (
          <View style={styles.section} wrap={false}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionAccent} />
              <Text style={styles.sectionTitle}>Professional Summary</Text>
            </View>
            <View style={styles.sectionDivider} />
            <Text style={styles.summaryText}>{pi.professionalPresentation}</Text>
          </View>
        )}

        {/* --- EXPERIENCE --- */}
        {visibility.experience && visibleExperience.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionAccent} />
              <Text style={styles.sectionTitle}>Work Experience</Text>
            </View>
            <View style={styles.sectionDivider} />
            {visibleExperience.map((job, index) => (
              <View key={job.id} style={index === visibleExperience.length - 1 ? styles.entryItemLast : styles.entryItem} wrap={false}>
                <View style={styles.entryTitleRow}>
                  <Text style={styles.entryTitle}>{job.title}</Text>
                  <Text style={styles.entryDate}>{formatDateRange(job.startDate, job.endDate, job.ongoing)}</Text>
                </View>
                <Text style={styles.entrySubtitle}>{job.employer}</Text>
                {job.description && <Text style={styles.entryDescription}>{job.description}</Text>}
              </View>
            ))}
          </View>
        )}

        {/* --- EDUCATION --- */}
        {visibility.education && visibleEducation.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionAccent} />
              <Text style={styles.sectionTitle}>Education</Text>
            </View>
            <View style={styles.sectionDivider} />
            {visibleEducation.map((edu, index) => (
              <View key={edu.id} style={index === visibleEducation.length - 1 ? styles.entryItemLast : styles.entryItem} wrap={false}>
                <View style={styles.entryTitleRow}>
                  <Text style={styles.entryTitle}>{edu.program}</Text>
                  <Text style={styles.entryDate}>{formatDateRange(edu.startDate, edu.endDate, edu.ongoing)}</Text>
                </View>
                <Text style={styles.entrySubtitle}>{edu.school}</Text>
                {edu.place && <Text style={styles.entryLocation}>{edu.place}</Text>}
                {edu.description && <Text style={styles.entryDescription}>{edu.description}</Text>}
              </View>
            ))}
          </View>
        )}

        {/* --- SKILLS --- */}
        {visibility.skills && visibleSkills.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionAccent} />
              <Text style={styles.sectionTitle}>Skills</Text>
            </View>
            <View style={styles.sectionDivider} />
            <View style={styles.skillsList}>
              <View style={styles.skillsRow}>
                {visibleSkills.map((skill) => (
                  <Text key={skill.id} style={styles.skillItem}>• {skill.skillName}</Text>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* --- PROJECTS --- */}
        {visibility.projects && visibleProjects.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionAccent} />
              <Text style={styles.sectionTitle}>Projects</Text>
            </View>
            <View style={styles.sectionDivider} />
            {visibleProjects.map((project, index) => (
              <View key={project.id} style={index === visibleProjects.length - 1 ? styles.projectItemLast : styles.projectItem} wrap={false}>
                <View style={styles.projectTitleRow}>
                  <Text style={styles.projectTitle}>{project.role}</Text>
                  <Text style={styles.projectDate}>{formatDateRange(project.startDate, project.endDate, project.isCurrent)}</Text>
                </View>
                {project.company && <Text style={styles.projectCompany}>{project.company}</Text>}
                {project.description && <Text style={styles.projectDescription}>{project.description}</Text>}
              </View>
            ))}
          </View>
        )}

        {/* --- CERTIFICATIONS --- */}
        {visibility.certifications && visibleCertifications.length > 0 && (
          <View style={styles.certSection}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionAccent} />
              <Text style={styles.sectionTitle}>Certifications</Text>
            </View>
            <View style={styles.sectionDivider} />
            {visibleCertifications.map((cert, index) => (
              <View key={cert.id} style={index === visibleCertifications.length - 1 ? styles.certItemLast : styles.certItem} wrap={false}>
                <Text style={styles.certTitle}>{cert.title}</Text>
                <View style={styles.certDetailsRow}>
                  <Text style={styles.certIssuer}>{cert.issuer}</Text>
                  <Text style={styles.certDot}>•</Text>
                  <Text style={styles.certDate}>
                    {(() => {
                      const start = safeFormat(cert.startDate);
                      const end = cert.noExpiry ? 'Does not expire' : safeFormat(cert.validDate);
                      if (start && end) return `${start} – ${end}`;
                      if (start) return start;
                      if (end) return end;
                      return '';
                    })()}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* --- LANGUAGES --- */}
        {visibility.languages && visibleLanguages.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionAccent} />
              <Text style={styles.sectionTitle}>Languages</Text>
            </View>
            <View style={styles.sectionDivider} />
            <View style={styles.languagesList}>
              <View style={styles.languagesRow}>
                {visibleLanguages.map((lang) => (
                  <Text key={lang.id} style={styles.languageItem}>
                    • {lang.language} <Text style={styles.languageLevel}>({lang.level})</Text>
                  </Text>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* --- REFERENCES --- */}
        {visibility.references && visibleReferences.length > 0 && (
          <View style={[styles.section, styles.sectionLast]}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionAccent} />
              <Text style={styles.sectionTitle}>References</Text>
            </View>
            <View style={styles.sectionDivider} />
            {visibleReferences.map((ref, index) => (
              <View key={ref.id} style={index === visibleReferences.length - 1 ? styles.referenceItemLast : styles.referenceItem} wrap={false}>
                <Text style={styles.referenceName}>{ref.firstName} {ref.lastName}</Text>
                <Text style={styles.referenceTitle}>{ref.positionTitle} at {ref.company}</Text>
                <View style={styles.referenceContactRow}>
                  <Text style={styles.referenceContact}>{ref.email}</Text>
                  <Text style={styles.referenceSeparator}>•</Text>
                  <Text style={styles.referenceContact}>{ref.phoneNumber}</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </Page>
    </Document>
  );
};

export default ATSResumeTemplate;
