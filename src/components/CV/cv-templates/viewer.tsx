'use client';

import { useState, useEffect, ChangeEvent } from 'react';
import { useForm } from 'react-hook-form';
import { PDFViewer, pdf } from '@react-pdf/renderer';
import dynamic from 'next/dynamic';
import { Download, RefreshCw, Eye, Settings, Plus, Trash2 } from 'lucide-react';
import { ResumeData, Experience, Education, Skill, Certification, Language, Project } from '../PdfViewer/pdfTypes';
import ResumeTemplate from './cvTestTemplate';

// Dynamically import PDF viewer to avoid SSR issues
const PDFViewerDynamic = dynamic(
    () => import('@react-pdf/renderer').then((mod) => mod.PDFViewer),
    { ssr: false }
);

// Sample initial data
const initialResumeData: ResumeData = {
    personalInfo: {
        firstName: 'John',
        lastName: 'Doe',
        title: 'Senior Software Engineer',
        email: 'john.doe@example.com',
        phone: '+1 (123) 456-7890',
        location: 'San Francisco, CA',
        linkedIn: 'johndoe',
        github: 'johndoe',
    },
    summary: 'Experienced software engineer with 8+ years of expertise in full-stack development, cloud architecture, and team leadership. Proven track record of delivering scalable solutions that improve efficiency by 40%.',
    experience: [
        {
            id: 1,
            company: 'Google',
            position: 'Senior Software Engineer',
            location: 'Mountain View, CA',
            startDate: '2020-01-01',
            endDate: '',
            current: true,
            responsibilities: [
                'Led a team of 8 developers in building cloud-native applications',
                'Architected microservices that reduced latency by 60%',
                'Implemented CI/CD pipelines improving deployment frequency',
            ],
        },
        {
            id: 2,
            company: 'Microsoft',
            position: 'Software Engineer',
            location: 'Redmond, WA',
            startDate: '2017-06-01',
            endDate: '2019-12-31',
            current: false,
            responsibilities: [
                'Developed full-stack features for Azure Portal',
                'Optimized database queries improving performance by 45%',
                'Collaborated with UX designers to implement responsive interfaces',
            ],
        },
    ],
    education: [
        {
            id: 1,
            school: 'Stanford University',
            degree: 'Master of Science',
            field: 'Computer Science',
            startDate: '2015-09-01',
            endDate: '2017-06-01',
            current: false,
            gpa: '3.9',
        },
        {
            id: 2,
            school: 'MIT',
            degree: 'Bachelor of Science',
            field: 'Computer Engineering',
            startDate: '2011-09-01',
            endDate: '2015-06-01',
            current: false,
            gpa: '3.8',
        },
    ],
    skills: [
        {
            id: 1,
            category: 'Programming Languages',
            items: 'JavaScript, TypeScript, Python, Java, Go',
        },
        {
            id: 2,
            category: 'Frameworks & Libraries',
            items: 'React, Node.js, Next.js, Express, Django',
        },
        {
            id: 3,
            category: 'Cloud & DevOps',
            items: 'AWS, Docker, Kubernetes, Terraform, CI/CD',
        },
    ],
    certifications: [
        {
            id: 1,
            name: 'AWS Solutions Architect',
            issuer: 'Amazon Web Services',
            date: '2022-06-01',
        },
    ],
    languages: [
        {
            id: 1,
            language: 'English',
            proficiency: 'Native',
        },
        {
            id: 2,
            language: 'Spanish',
            proficiency: 'Fluent',
        },
    ],
    projects: [
        {
            id: 1,
            name: 'Open Source Dashboard',
            description: 'Real-time analytics dashboard built with React and WebSocket',
            technologies: ['React', 'TypeScript', 'WebSocket', 'Chart.js'],
            url: 'https://github.com/johndoe/dashboard',
        },
    ],
};

const SideBySideResumeBuilder = () => {
    const [resumeData, setResumeData] = useState<ResumeData>(initialResumeData);
    const [previewKey, setPreviewKey] = useState<number>(0);
    const [splitView, setSplitView] = useState<boolean>(true);
    const [isGenerating, setIsGenerating] = useState<boolean>(false);

    const { register, handleSubmit } = useForm<ResumeData>({
        defaultValues: initialResumeData,
    });

    // Update preview when data changes
    useEffect(() => {
        setPreviewKey((prev) => prev + 1);
    }, [resumeData]);

    const handleInputChange = (
        section: keyof ResumeData | string,
        field: string,
        value: string | boolean | string[],
        index?: number
    ): void => {
        setResumeData((prev) => {
            if (typeof index === 'number') {
                // Handle array sections
                if (section === 'experience') {
                    const newExperience = [...prev.experience];
                    newExperience[index] = { ...newExperience[index]!, [field]: value };
                    return { ...prev, experience: newExperience };
                } else if (section === 'education') {
                    const newEducation = [...prev.education];
                    newEducation[index] = { ...newEducation[index]!, [field]: value };
                    return { ...prev, education: newEducation };
                } else if (section === 'skills') {
                    const newSkills = [...prev.skills];
                    newSkills[index] = { ...newSkills[index]!, [field]: value };
                    return { ...prev, skills: newSkills };
                } else if (section === 'certifications' && prev.certifications) {
                    const newCerts = [...prev.certifications];
                    newCerts[index] = { ...newCerts[index]!, [field]: value };
                    return { ...prev, certifications: newCerts };
                } else if (section === 'languages' && prev.languages) {
                    const newLangs = [...prev.languages];
                    newLangs[index] = { ...newLangs[index]!, [field]: value };
                    return { ...prev, languages: newLangs };
                } else if (section === 'projects' && prev.projects) {
                    const newProjects = [...prev.projects];
                    newProjects[index] = { ...newProjects[index]!, [field]: value };
                    return { ...prev, projects: newProjects };
                }
            } else if (section.includes('.')) {
                // Handle nested objects (personalInfo)
                const [main, sub] = section.split('.');
                if (main === 'personalInfo') {
                    return {
                        ...prev,
                        personalInfo: {
                            ...prev.personalInfo,
                            [String(sub)]: value,
                        },
                    };
                }
            } else {
                // Handle simple fields
                return {
                    ...prev,
                    [section]: value,
                };
            }
            return prev;
        });
    };

    const addExperience = (): void => {
        const newExperience: Experience = {
            id: Date.now(),
            company: '',
            position: '',
            location: '',
            startDate: '',
            endDate: '',
            current: false,
            responsibilities: [''],
        };
        setResumeData((prev) => ({
            ...prev,
            experience: [...prev.experience, newExperience],
        }));
    };

    const removeExperience = (id: number): void => {
        setResumeData((prev) => ({
            ...prev,
            experience: prev.experience.filter((exp) => exp.id !== id),
        }));
    };

    const addSkill = (): void => {
        const newSkill: Skill = {
            id: Date.now(),
            category: '',
            items: '',
        };
        setResumeData((prev) => ({
            ...prev,
            skills: [...prev.skills, newSkill],
        }));
    };

    const removeSkill = (id: number): void => {
        setResumeData((prev) => ({
            ...prev,
            skills: prev.skills.filter((skill) => skill.id !== id),
        }));
    };

    const addEducation = (): void => {
        const newEducation: Education = {
            id: Date.now(),
            school: '',
            degree: '',
            field: '',
            startDate: '',
            endDate: '',
            current: false,
        };
        setResumeData((prev) => ({
            ...prev,
            education: [...prev.education, newEducation],
        }));
    };

    const removeEducation = (id: number): void => {
        setResumeData((prev) => ({
            ...prev,
            education: prev.education.filter((edu) => edu.id !== id),
        }));
    };

    const addCertification = (): void => {
        const newCert: Certification = {
            id: Date.now(),
            name: '',
            issuer: '',
            date: '',
        };
        setResumeData((prev) => ({
            ...prev,
            certifications: [...(prev.certifications || []), newCert],
        }));
    };

    const removeCertification = (id: number): void => {
        setResumeData((prev) => ({
            ...prev,
            certifications: prev.certifications?.filter((cert) => cert.id !== id),
        }));
    };

    const addProject = (): void => {
        const newProject: Project = {
            id: Date.now(),
            name: '',
            description: '',
            technologies: [],
        };
        setResumeData((prev) => ({
            ...prev,
            projects: [...(prev.projects || []), newProject],
        }));
    };

    const removeProject = (id: number): void => {
        setResumeData((prev) => ({
            ...prev,
            projects: prev.projects?.filter((project) => project.id !== id),
        }));
    };

    const handleDownloadPDF = async (): Promise<void> => {
        setIsGenerating(true);
        try {
            const blob = await pdf(<ResumeTemplate data={resumeData} />).toBlob();
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${resumeData.personalInfo.firstName}_${resumeData.personalInfo.lastName}_Resume.pdf`;
            link.click();
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error generating PDF:', error);
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
                <div className="max-w-[99vw] mx-auto px-4 py-4">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <Download className="text-blue-600" size={24} />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Live Resume Builder</h1>
                                <p className="text-gray-600 text-sm">Edit on left • See PDF update on right</p>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                            <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
                                <button
                                    onClick={() => setSplitView(true)}
                                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${splitView ? 'bg-white shadow text-blue-600' : 'text-gray-600'}`}
                                >
                                    Split View
                                </button>
                                <button
                                    onClick={() => setSplitView(false)}
                                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${!splitView ? 'bg-white shadow text-blue-600' : 'text-gray-600'}`}
                                >
                                    Full Screen
                                </button>
                            </div>

                            <button
                                onClick={handleDownloadPDF}
                                disabled={isGenerating}
                                className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                {isGenerating ? (
                                    <>
                                        <RefreshCw className="animate-spin" size={18} />
                                        Generating...
                                    </>
                                ) : (
                                    <>
                                        <Download size={18} />
                                        Download PDF
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content - Side by Side */}
            <main className="max-w-[99vw] mx-auto p-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-120px)]">
                    {/* Left Panel - Editor */}
                    <div className={`bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden transition-all duration-300 ${splitView ? '' : 'lg:col-span-2'}`}>
                        <div className="sticky top-0 bg-white border-b border-gray-200 z-10">
                            <div className="flex items-center justify-between p-4">
                                <div className="flex items-center gap-2">
                                    <Settings size={20} className="text-gray-500" />
                                    <h2 className="text-lg font-semibold text-gray-900">Resume Editor</h2>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                                    Live Editing
                                </div>
                            </div>
                        </div>

                        <div className="p-6 overflow-y-auto h-[calc(100%-70px)]">
                            <form className="space-y-8">
                                {/* Personal Information */}
                                <section className="space-y-4">
                                    <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Personal Information</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {[
                                            { id: 'firstName', label: 'First Name', section: 'personalInfo.firstName' },
                                            { id: 'lastName', label: 'Last Name', section: 'personalInfo.lastName' },
                                            { id: 'title', label: 'Job Title', section: 'personalInfo.title' },
                                            { id: 'email', label: 'Email', section: 'personalInfo.email', type: 'email' },
                                            { id: 'phone', label: 'Phone', section: 'personalInfo.phone' },
                                            { id: 'location', label: 'Location', section: 'personalInfo.location' },
                                            { id: 'linkedIn', label: 'LinkedIn Username', section: 'personalInfo.linkedIn' },
                                            { id: 'github', label: 'GitHub Username', section: 'personalInfo.github' },
                                        ].map((field) => (
                                            <div key={field.id}>
                                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                                    {field.label}
                                                </label>
                                                <input
                                                    type={field.type || 'text'}
                                                    value={field.section.includes('.') ?
                                                        (resumeData.personalInfo as any)[field.id] :
                                                        (resumeData as any)[field.section]}
                                                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                                                        handleInputChange(field.section, field.id, e.target.value)}
                                                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                                    placeholder={`Enter ${field.label.toLowerCase()}`}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </section>

                                {/* Professional Summary */}
                                <section className="space-y-4">
                                    <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Professional Summary</h3>
                                    <textarea
                                        value={resumeData.summary}
                                        onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
                                            handleInputChange('summary', 'summary', e.target.value)}
                                        rows={4}
                                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all"
                                        placeholder="Write a compelling summary of your professional experience..."
                                    />
                                </section>

                                {/* Work Experience */}
                                <section className="space-y-6">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Work Experience</h3>
                                        <button
                                            type="button"
                                            onClick={addExperience}
                                            className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 text-sm font-medium transition-colors"
                                        >
                                            <Plus size={16} /> Add Experience
                                        </button>
                                    </div>

                                    {resumeData.experience.map((exp, index) => (
                                        <div key={exp.id} className="p-4 border border-gray-200 rounded-xl bg-gray-50/50">
                                            <div className="flex justify-between items-start mb-4">
                                                <h4 className="font-medium text-gray-900">Experience #{index + 1}</h4>
                                                {resumeData.experience.length > 1 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => removeExperience(exp.id)}
                                                        className="flex items-center gap-1 text-red-500 hover:text-red-700 text-sm"
                                                    >
                                                        <Trash2 size={14} /> Remove
                                                    </button>
                                                )}
                                            </div>

                                            <div className="space-y-4">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Company</label>
                                                        <input
                                                            type="text"
                                                            value={exp.company}
                                                            onChange={(e: ChangeEvent<HTMLInputElement>) =>
                                                                handleInputChange('experience', 'company', e.target.value, index)}
                                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                                            placeholder="Company name"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Position</label>
                                                        <input
                                                            type="text"
                                                            value={exp.position}
                                                            onChange={(e: ChangeEvent<HTMLInputElement>) =>
                                                                handleInputChange('experience', 'position', e.target.value, index)}
                                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                                            placeholder="Job title"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Location</label>
                                                        <input
                                                            type="text"
                                                            value={exp.location}
                                                            onChange={(e: ChangeEvent<HTMLInputElement>) =>
                                                                handleInputChange('experience', 'location', e.target.value, index)}
                                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                                            placeholder="City, State"
                                                        />
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Start Date</label>
                                                            <input
                                                                type="month"
                                                                value={exp.startDate}
                                                                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                                                                    handleInputChange('experience', 'startDate', e.target.value, index)}
                                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700 mb-1.5">End Date</label>
                                                            <input
                                                                type="month"
                                                                value={exp.endDate}
                                                                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                                                                    handleInputChange('experience', 'endDate', e.target.value, index)}
                                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                                                disabled={exp.current}
                                                                placeholder={exp.current ? 'Present' : ''}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type="checkbox"
                                                        id={`current-${exp.id}`}
                                                        checked={exp.current}
                                                        onChange={(e: ChangeEvent<HTMLInputElement>) =>
                                                            handleInputChange('experience', 'current', e.target.checked, index)}
                                                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                    />
                                                    <label htmlFor={`current-${exp.id}`} className="text-sm text-gray-700">
                                                        I currently work here
                                                    </label>
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Responsibilities</label>
                                                    <div className="space-y-2">
                                                        {exp.responsibilities.map((resp, respIndex) => (
                                                            <div key={respIndex} className="flex gap-2">
                                                                <input
                                                                    type="text"
                                                                    value={resp}
                                                                    onChange={(e: ChangeEvent<HTMLInputElement>) => {
                                                                        const newResponsibilities = [...exp.responsibilities];
                                                                        newResponsibilities[respIndex] = e.target.value;
                                                                        handleInputChange('experience', 'responsibilities', newResponsibilities, index);
                                                                    }}
                                                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                                                    placeholder="Describe a responsibility or achievement"
                                                                />
                                                                {exp.responsibilities.length > 1 && (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => {
                                                                            const newResponsibilities = exp.responsibilities.filter((_, i) => i !== respIndex);
                                                                            handleInputChange('experience', 'responsibilities', newResponsibilities, index);
                                                                        }}
                                                                        className="px-3 text-red-500 hover:text-red-700"
                                                                    >
                                                                        ✕
                                                                    </button>
                                                                )}
                                                            </div>
                                                        ))}
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                const newResponsibilities = [...exp.responsibilities, ''];
                                                                handleInputChange('experience', 'responsibilities', newResponsibilities, index);
                                                            }}
                                                            className="text-sm text-blue-600 hover:text-blue-700"
                                                        >
                                                            + Add responsibility
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </section>

                                {/* Skills */}
                                <section className="space-y-6">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Skills</h3>
                                        <button
                                            type="button"
                                            onClick={addSkill}
                                            className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 text-sm font-medium transition-colors"
                                        >
                                            <Plus size={16} /> Add Skill Category
                                        </button>
                                    </div>

                                    {resumeData.skills.map((skill, index) => (
                                        <div key={skill.id} className="p-4 border border-gray-200 rounded-xl bg-gray-50/50">
                                            <div className="flex justify-between items-start mb-4">
                                                <h4 className="font-medium text-gray-900">Skill Category #{index + 1}</h4>
                                                {resumeData.skills.length > 1 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => removeSkill(skill.id)}
                                                        className="flex items-center gap-1 text-red-500 hover:text-red-700 text-sm"
                                                    >
                                                        <Trash2 size={14} /> Remove
                                                    </button>
                                                )}
                                            </div>

                                            <div className="space-y-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Category</label>
                                                    <input
                                                        type="text"
                                                        value={skill.category}
                                                        onChange={(e: ChangeEvent<HTMLInputElement>) =>
                                                            handleInputChange('skills', 'category', e.target.value, index)}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                                        placeholder="e.g., Programming Languages, Tools, etc."
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Skills (comma separated)</label>
                                                    <input
                                                        type="text"
                                                        value={skill.items}
                                                        onChange={(e: ChangeEvent<HTMLInputElement>) =>
                                                            handleInputChange('skills', 'items', e.target.value, index)}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                                        placeholder="e.g., JavaScript, React, Node.js, Python"
                                                    />
                                                    <p className="text-xs text-gray-500 mt-1.5">Separate skills with commas</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </section>

                                {/* Education */}
                                <section className="space-y-6">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Education</h3>
                                        <button
                                            type="button"
                                            onClick={addEducation}
                                            className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 text-sm font-medium transition-colors"
                                        >
                                            <Plus size={16} /> Add Education
                                        </button>
                                    </div>

                                    {resumeData.education.map((edu, index) => (
                                        <div key={edu.id} className="p-4 border border-gray-200 rounded-xl bg-gray-50/50">
                                            <div className="flex justify-between items-start mb-4">
                                                <h4 className="font-medium text-gray-900">Education #{index + 1}</h4>
                                                {resumeData.education.length > 1 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => removeEducation(edu.id)}
                                                        className="flex items-center gap-1 text-red-500 hover:text-red-700 text-sm"
                                                    >
                                                        <Trash2 size={14} /> Remove
                                                    </button>
                                                )}
                                            </div>

                                            <div className="space-y-4">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">School/University</label>
                                                        <input
                                                            type="text"
                                                            value={edu.school}
                                                            onChange={(e: ChangeEvent<HTMLInputElement>) =>
                                                                handleInputChange('education', 'school', e.target.value, index)}
                                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                                            placeholder="University name"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Degree</label>
                                                        <input
                                                            type="text"
                                                            value={edu.degree}
                                                            onChange={(e: ChangeEvent<HTMLInputElement>) =>
                                                                handleInputChange('education', 'degree', e.target.value, index)}
                                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                                            placeholder="e.g., Bachelor of Science"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Field of Study</label>
                                                        <input
                                                            type="text"
                                                            value={edu.field}
                                                            onChange={(e: ChangeEvent<HTMLInputElement>) =>
                                                                handleInputChange('education', 'field', e.target.value, index)}
                                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                                            placeholder="e.g., Computer Science"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">GPA</label>
                                                        <input
                                                            type="text"
                                                            value={edu.gpa || ''}
                                                            onChange={(e: ChangeEvent<HTMLInputElement>) =>
                                                                handleInputChange('education', 'gpa', e.target.value, index)}
                                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                                            placeholder="e.g., 3.9/4.0"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Start Date</label>
                                                        <input
                                                            type="month"
                                                            value={edu.startDate}
                                                            onChange={(e: ChangeEvent<HTMLInputElement>) =>
                                                                handleInputChange('education', 'startDate', e.target.value, index)}
                                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">End Date</label>
                                                        <input
                                                            type="month"
                                                            value={edu.endDate}
                                                            onChange={(e: ChangeEvent<HTMLInputElement>) =>
                                                                handleInputChange('education', 'endDate', e.target.value, index)}
                                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </section>
                            </form>
                        </div>
                    </div>

                    {/* Right Panel - PDF Preview */}
                    {splitView && (
                        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
                            <div className="sticky top-0 bg-white border-b border-gray-200 z-10">
                                <div className="flex items-center justify-between p-4">
                                    <div className="flex items-center gap-2">
                                        <Eye size={20} className="text-gray-500" />
                                        <h2 className="text-lg font-semibold text-gray-900">Live PDF Preview</h2>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 rounded-md text-xs">
                                            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                                            Auto-updating
                                        </div>
                                        <button
                                            onClick={() => setPreviewKey(prev => prev + 1)}
                                            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                                            title="Refresh preview"
                                        >
                                            <RefreshCw size={16} className="text-gray-500" />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="p-4 h-[calc(100%-70px)] overflow-hidden">
                                <div className="h-full border-2 border-dashed border-gray-300 rounded-xl overflow-auto bg-gray-50">
                                    <PDFViewerDynamic
                                        key={previewKey}
                                        showToolbar={false}
                                        width="100%"
                                        height="100%"
                                        className="min-h-full"
                                    >
                                        <ResumeTemplate data={resumeData} />
                                    </PDFViewerDynamic>
                                </div>

                                <div className="mt-4 text-center">
                                    <p className="text-sm text-gray-500">
                                        Changes appear instantly. Scroll to see all pages.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default SideBySideResumeBuilder;