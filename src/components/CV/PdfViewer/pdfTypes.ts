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

export interface Experience {
  id: number;
  company: string;
  position: string;
  location: string;
  startDate: string;
  endDate: string;
  current: boolean;
  responsibilities: string[];
  achievements?: string;
}

export interface Education {
  id: number;
  school: string;
  degree: string;
  field: string;
  startDate: string;
  endDate: string;
  current: boolean;
  gpa?: string;
  honors?: string;
}

export interface Skill {
  id: number;
  category: string;
  items: string;
}

export interface Certification {
  id: number;
  name: string;
  issuer: string;
  date: string;
  url?: string;
}

export interface Language {
  id: number;
  language: string;
  proficiency: string;
}

export interface Project {
  id: number;
  name: string;
  description: string;
  technologies: string[];
  url?: string;
}

export interface ResumeData {
  personalInfo: PersonalInfo;
  summary: string;
  experience: Experience[];
  education: Education[];
  skills: Skill[];
  certifications?: Certification[];
  languages?: Language[];
  projects?: Project[];
}

export interface TemplateProps {
  data: ResumeData;
}