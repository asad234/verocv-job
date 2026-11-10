'use client';

import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { format } from 'date-fns';
import React from 'react';

// Assuming interfaces are available as provided
export interface PersonalInfo {
    firstName: string;
    lastName: string;
    title: string;
    email: string;
    phone: string;
    location: string;
    linkedIn?: string;
    github?: string;
    portfolio?: string;
}

export interface ResumeData {
    personalInfo: PersonalInfo;
    summary: string;
    experience: any[];
    education: any[];
    skills: any[];
    certifications?: any[];
    languages?: any[];
    projects?: any[];
}

export interface TemplateProps {
    data: ResumeData;
}

/* -------------------------------------------------
    COLORS + BASE THEME
-------------------------------------------------- */
const COLORS = {
    PRIMARY: '#1E3A8A',
    ACCENT: '#3B82F6',
    BG_LIGHT: '#F3F4F6',
    TEXT_DARK: '#111827',
    TEXT_MEDIUM: '#4B5563',
    TEXT_LIGHT: '#6B7280',
    BORDER: '#E5E7EB',
};

/* -------------------------------------------------
    IMPROVED PREMIUM STYLES
-------------------------------------------------- */
const styles = StyleSheet.create({
    page: {
        fontFamily: 'Helvetica',
        fontSize: 10,
        padding: 0,
        color: COLORS.TEXT_DARK,
    },

    /* ------------------ HEADER ------------------ */
    headerContainer: {
        backgroundColor: COLORS.BG_LIGHT,
        paddingHorizontal: 40,
        paddingVertical: 28,
        borderBottomColor: COLORS.BORDER,
        borderBottomWidth: 1,
    },

    headerName: {
        fontSize: 26,
        fontWeight: 'bold',
        color: COLORS.TEXT_DARK,
        marginBottom: 4,
    },

    headerTitle: {
        fontSize: 13,
        color: COLORS.PRIMARY,
        marginBottom: 12,
    },

    headerContacts: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'flex-start',
    },

    // Modified style to handle separators better without causing text overflow
    headerContactItem: {
        fontSize: 9,
        color: COLORS.TEXT_MEDIUM,
        // Using a fixed padding for separation instead of a border which is hard to control
        paddingRight: 10,
    },
    separator: {
        fontSize: 9,
        color: COLORS.TEXT_LIGHT,
        marginRight: 10,
    },

    /* ------------------ BODY LAYOUT ------------------ */
    content: {
        flexDirection: 'row',
        paddingHorizontal: 40,
        paddingVertical: 20,
        gap: 25,
        // Ensure content wraps pages correctly. Views inside must manage their own wrapping.
        flexGrow: 1,
    },

    leftSidebar: {
        width: '28%',
        paddingRight: 10,
        borderRightWidth: 1,
        borderRightColor: COLORS.BORDER,
    },

    rightColumn: {
        width: '72%',
        paddingLeft: 10,
    },

    /* ------------------ SECTION ------------------ */
    section: {
        marginBottom: 16,
    },

    sectionTitle: {
        fontSize: 12,
        fontWeight: 'bold',
        color: COLORS.PRIMARY,
        marginBottom: 8,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },

    /* ------------------ SUMMARY ------------------ */
    summaryText: {
        fontSize: 10,
        color: COLORS.TEXT_MEDIUM,
        lineHeight: 1.5,
    },

    /* ------------------ EXPERIENCE ------------------ */
    jobItem: {
        marginBottom: 14,
        // Allow job items to split across pages if needed
        breakInside: 'auto',
    },

    jobTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        // Prevent job title/company/date from splitting from each other
        wrap: false,
    },

    jobTitle: {
        fontSize: 11,
        fontWeight: 'bold',
        color: COLORS.TEXT_DARK,
    },

    company: {
        fontSize: 10,
        color: COLORS.TEXT_MEDIUM,
    },

    date: {
        fontSize: 9,
        color: COLORS.TEXT_LIGHT,
    },

    jobLocation: {
        fontSize: 9,
        color: COLORS.TEXT_LIGHT,
        marginBottom: 4,
    },

    bulletRow: {
        flexDirection: 'row',
        marginBottom: 3,
        // Allow individual bullet points to wrap, but not split the dot from the text start
        wrap: false,
    },

    bulletDot: {
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: COLORS.ACCENT,
        marginRight: 6,
        marginTop: 4,
        flexShrink: 0,
    },

    bulletText: {
        width: '95%',
        fontSize: 9.5,
        lineHeight: 1.4,
    },

    /* ------------------ PROJECTS ------------------ */
    projectName: {
        fontSize: 10.5,
        fontWeight: 'bold',
        marginBottom: 1,
        color: COLORS.TEXT_DARK,
    },

    projectDescription: {
        fontSize: 9.5,
        color: COLORS.TEXT_MEDIUM,
        marginBottom: 2,
    },

    projectTech: {
        fontSize: 8.5,
        color: COLORS.TEXT_LIGHT,
        fontStyle: 'italic',
        marginBottom: 5,
    },

    /* ------------------ SIDEBAR ITEMS (Skills, Education, Certs, Langs) ------------------ */
    skillCategory: {
        marginBottom: 10,
    },

    skillCategoryTitle: {
        fontSize: 10,
        fontWeight: 'bold',
        marginBottom: 2,
        color: COLORS.TEXT_DARK,
    },

    skillItems: {
        fontSize: 9,
        color: COLORS.TEXT_MEDIUM,
        lineHeight: 1.4,
    },

    eduItem: {
        marginBottom: 12,
        wrap: false, // Try to keep the entire education item on one page
    },

    eduDegree: {
        fontSize: 10.5,
        fontWeight: 'bold',
        marginBottom: 1,
    },

    eduSchool: {
        fontSize: 10,
        color: COLORS.TEXT_MEDIUM,
    },

    /* ------------------ FOOTER PAGE NUMBER ------------------ */
    pageNumber: {
        position: 'absolute',
        bottom: 20,
        left: 0,
        right: 0,
        textAlign: 'center',
        fontSize: 9,
        color: COLORS.TEXT_LIGHT,
    },
});

/* -------------------------------------------------
    HELPERS
-------------------------------------------------- */
const formatDate = (dateString?: string | null): string => {
    if (!dateString) return 'Present';
    try {
        return format(new Date(dateString), 'MMM yyyy');
    } catch {
        return dateString;
    }
};

/* -------------------------------------------------
    COMPONENT
-------------------------------------------------- */
const ResumeTemplate: React.FC<TemplateProps> = ({ data }) => {
    const p = data.personalInfo;

    // Filter out null/undefined values and format the links
    const contactItems = [
        p.email,
        p.phone,
        p.location,
        p.linkedIn && `LinkedIn: linkedin.com/in/${p.linkedIn}`,
        p.github && `GitHub: github.com/${p.github}`,
        p.portfolio && `Portfolio: ${p.portfolio}`,
    ].filter(Boolean) as string[];

    return (
        <Document>
            {/* The main page wrapper must allow content to flow/wrap */}
            <Page size="A4" style={styles.page} wrap>
                {/* HEADER - Remains fixed at the top */}
                <View style={styles.headerContainer} fixed>
                    <Text style={styles.headerName}>
                        {p.firstName} {p.lastName}
                    </Text>
                    <Text style={styles.headerTitle}>{p.title}</Text>

                    {/* Contact details, separated by pipe, utilizing flexWrap */}
                    <View style={styles.headerContacts}>
                        {contactItems.map((item, idx) => (
                            <React.Fragment key={idx}>
                                <Text style={styles.headerContactItem}>{item}</Text>
                                {/* Separator only if not the last item */}
                                {idx < contactItems.length - 1 && <Text style={styles.separator}>|</Text>}
                            </React.Fragment>
                        ))}
                    </View>
                </View>

                {/* CONTENT AREA - This main container is allowed to split across pages (via default wrap=true) */}
                <View style={styles.content}>
                    {/* LEFT SIDEBAR - Content here must manage its own wrapping. */}
                    <View style={styles.leftSidebar}>

                        {/* Skills */}
                        {data.skills.length > 0 && (
                            <View style={styles.section} wrap={false}> {/* Try to keep Skills section together */}
                                <Text style={styles.sectionTitle}>Skills</Text>
                                {data.skills.map((skill) => (
                                    <View key={skill.id} style={styles.skillCategory}>
                                        <Text style={styles.skillCategoryTitle}>{skill.category}</Text>
                                        <Text style={styles.skillItems}>{skill.items}</Text>
                                    </View>
                                ))}
                            </View>
                        )}

                        {/* Languages */}
                        {data.languages!.length > 0 && (
                            <View style={styles.section} wrap={false}> {/* Try to keep Languages section together */}
                                <Text style={styles.sectionTitle}>Languages</Text>
                                {data.languages!.map((lang: any) => (
                                    <Text key={lang.id} style={{ fontSize: 9, marginBottom: 3 }}>
                                        **{lang.language}:** {lang.proficiency}
                                    </Text>
                                ))}
                            </View>
                        )}

                        {/* Certifications */}
                        {data.certifications!.length > 0 && (
                            <View style={styles.section} wrap={false}> {/* Try to keep Certifications section together */}
                                <Text style={styles.sectionTitle}>Certifications</Text>
                                {data.certifications!.map((cert: any) => (
                                    <View key={cert.id} style={{ marginBottom: 8 }} wrap={false}>
                                        <Text style={{ fontSize: 9.5, fontWeight: 'bold' }}>{cert.name}</Text>
                                        <Text style={{ fontSize: 8.5, color: COLORS.TEXT_LIGHT }}>
                                            {cert.issuer} • {formatDate(cert.date)}
                                        </Text>
                                    </View>
                                ))}
                            </View>
                        )}
                    </View>

                    {/* RIGHT MAIN COLUMN - This is the primary flowing content area. */}
                    <View style={styles.rightColumn}>

                        {/* Summary */}
                        {data.summary && (
                            <View style={styles.section} wrap={false}>
                                <Text style={styles.sectionTitle}>Summary</Text>
                                <Text style={styles.summaryText}>{data.summary}</Text>
                            </View>
                        )}

                        {/* Experience */}
                        {data.experience.length > 0 && (
                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>Experience</Text>
                                {data.experience.map((exp: any) => (
                                    <View key={exp.id} style={styles.jobItem} >
                                        <View style={styles.jobTop}>
                                            <View>
                                                <Text style={styles.jobTitle}>{exp.position}</Text>
                                                <Text style={styles.company}>{exp.company}</Text>
                                            </View>
                                            <Text style={styles.date}>
                                                {formatDate(exp.startDate)} – {exp.current ? 'Present' : formatDate(exp.endDate)}
                                            </Text>
                                        </View>

                                        {exp.location && <Text style={styles.jobLocation}>{exp.location}</Text>}

                                        {exp.responsibilities?.map((item: string, i: number) => (
                                            <View key={i} style={styles.bulletRow}>
                                                <View style={styles.bulletDot} />
                                                <Text style={styles.bulletText}>{item}</Text>
                                            </View>
                                        ))}
                                    </View>
                                ))}
                            </View>
                        )}

                        {/* Projects */}
                        {data.projects!.length > 0 && (
                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>Projects</Text>
                                {data.projects!.map((project: any) => (
                                    <View key={project.id} style={{ marginBottom: 10 }} >
                                        <Text style={styles.projectName}>{project.name}</Text>
                                        <Text style={styles.projectDescription}>{project.description}</Text>

                                        {project.technologies?.length > 0 && (
                                            <Text style={styles.projectTech}>
                                                Tech: {project.technologies.join(', ')}
                                            </Text>
                                        )}

                                        {project.url && (
                                            <Text style={styles.projectTech}>Link: {project.url}</Text>
                                        )}
                                    </View>
                                ))}
                            </View>
                        )}

                        {/* Education */}
                        {data.education.length > 0 && (
                            <View style={styles.section} >
                                <Text style={styles.sectionTitle}>Education</Text>
                                {data.education.map((edu: any) => (
                                    <View key={edu.id} style={styles.eduItem} wrap={false}>
                                        <Text style={styles.eduDegree}>{edu.degree} in {edu.field}</Text>
                                        <Text style={styles.eduSchool}>{edu.school}</Text>
                                        <Text style={{ fontSize: 9, color: COLORS.TEXT_LIGHT }}>
                                            {formatDate(edu.startDate)} – {edu.current ? 'Present' : formatDate(edu.endDate)}
                                        </Text>
                                    </View>
                                ))}
                            </View>
                        )}

                    </View>
                </View>

                {/* PAGE NUMBER - Must be fixed to stay on the bottom */}
                <Text
                    style={styles.pageNumber}
                    render={({ pageNumber, totalPages }) =>
                        `${p.firstName} ${p.lastName} • Page ${pageNumber} of ${totalPages}`
                    }
                    fixed
                />
            </Page>
        </Document>
    );
};

export default ResumeTemplate;