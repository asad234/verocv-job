// Shared mock data used by EmployeesView and AdminReports
// Place at: components/Dashboard/Company-dashboard/ba-views/mockData.ts

export type EmployeeStatus = 'active' | 'inactive' | 'pending'
export type EmployeeRole = '3.Employee' | '4.Consultant'
export type SlotType = 'available' | 'busy' | 'partial' | 'off'

export interface CV {
  id: string
  title: string
  tag: string
  skills: number
  jobs: number
  updatedAt: string
}

export interface PortfolioItem {
  id: string
  title: string
  description: string
  tags: string[]
  year: string
  icon: string
}

export interface Employee {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  title: string
  role: EmployeeRole
  status: EmployeeStatus
  managerId: string // which manager owns this employee
  cvs: CV[]
  portfolio: PortfolioItem[]
  jobPlaced: boolean // has this person been placed in a job?
  joinedAt: string
}

export interface Manager {
  id: string
  name: string
  initials: string
  department: string
  email: string
  status: 'active' | 'inactive' | 'pending'
  joinedAt: string
  /* computed from employees */
  totalEmployees: number
  activeEmployees: number
  placed: number // employees placed in jobs
  cvCreated: number
  interviewRate: string
}

/* ── Employees ─────────────────────────────────────────── */
export const EMPLOYEES: Employee[] = [
  // Manager 1 — Lena Larsson (IT)
  {
    id: 'e1',
    firstName: 'Emma',
    lastName: 'Larsson',
    email: 'e.larsson@nordic.se',
    phone: '+46 70 111 22 33',
    title: 'Frontend Developer',
    role: '3.Employee',
    status: 'active',
    managerId: 'm1',
    joinedAt: 'Jan 2024',
    jobPlaced: true,
    cvs: [
      {
        id: 'cv1',
        title: 'Emma Larsson CV_2',
        tag: 'modern',
        skills: 10,
        jobs: 9,
        updatedAt: 'Mar 27, 2026',
      },
      {
        id: 'cv2',
        title: 'Emma Larsson CV_1',
        tag: 'classic',
        skills: 8,
        jobs: 6,
        updatedAt: 'Mar 10, 2026',
      },
    ],
    portfolio: [
      {
        id: 'p1',
        title: 'E-commerce Redesign',
        description: 'Full React/Tailwind redesign for a Nordic retailer.',
        tags: ['React', 'TypeScript', 'Tailwind'],
        year: '2025',
        icon: 'tabler:layout',
      },
      {
        id: 'p2',
        title: 'Design System',
        description: 'Company-wide component library with 80+ components.',
        tags: ['Storybook', 'Figma'],
        year: '2024',
        icon: 'tabler:palette',
      },
    ],
  },
  {
    id: 'e2',
    firstName: 'Lars',
    lastName: 'Svensson',
    email: 'l.svensson@nordic.se',
    phone: '+46 70 222 33 44',
    title: 'Backend Engineer',
    role: '3.Employee',
    status: 'active',
    managerId: 'm1',
    joinedAt: 'Mar 2024',
    jobPlaced: true,
    cvs: [
      {
        id: 'cv3',
        title: 'Lars Svensson CV_1',
        tag: 'modern',
        skills: 7,
        jobs: 4,
        updatedAt: 'Mar 20, 2026',
      },
    ],
    portfolio: [
      {
        id: 'p3',
        title: 'REST API Platform',
        description: 'Scalable Node.js API handling 10M+ requests/day.',
        tags: ['Node.js', 'PostgreSQL', 'Redis'],
        year: '2025',
        icon: 'tabler:server',
      },
    ],
  },
  {
    id: 'e3',
    firstName: 'Anna',
    lastName: 'Björk',
    email: 'a.bjork@nordic.se',
    phone: '+46 70 333 44 55',
    title: 'UX Designer',
    role: '3.Employee',
    status: 'active',
    managerId: 'm1',
    joinedAt: 'Feb 2023',
    jobPlaced: false,
    cvs: [
      {
        id: 'cv4',
        title: 'Anna Björk CV_1',
        tag: 'creative',
        skills: 12,
        jobs: 11,
        updatedAt: 'Feb 15, 2026',
      },
    ],
    portfolio: [
      {
        id: 'p4',
        title: 'Mobile App UX',
        description: 'End-to-end UX for a fintech app with 50k+ downloads.',
        tags: ['Figma', 'UX Research'],
        year: '2025',
        icon: 'tabler:device-mobile',
      },
      {
        id: 'p5',
        title: 'Brand Identity',
        description: 'Visual identity for a B2B SaaS company.',
        tags: ['Branding', 'Figma'],
        year: '2024',
        icon: 'tabler:brand-figma',
      },
    ],
  },
  {
    id: 'e4',
    firstName: 'Marcus',
    lastName: 'Holm',
    email: 'm.holm@nordic.se',
    phone: '+46 70 444 55 66',
    title: 'Project Manager',
    role: '3.Employee',
    status: 'pending',
    managerId: 'm1',
    joinedAt: 'Apr 2025',
    jobPlaced: false,
    cvs: [
      {
        id: 'cv5',
        title: 'Marcus Holm CV_1',
        tag: 'classic',
        skills: 5,
        jobs: 2,
        updatedAt: 'Apr 05, 2026',
      },
    ],
    portfolio: [],
  },

  // Manager 2 — Johan Berg (Marketing)
  {
    id: 'e5',
    firstName: 'Sofia',
    lastName: 'Lindgren',
    email: 's.lindgren@nordic.se',
    phone: '+46 70 555 66 77',
    title: 'Data Analyst',
    role: '4.Consultant',
    status: 'active',
    managerId: 'm2',
    joinedAt: 'Jun 2023',
    jobPlaced: true,
    cvs: [
      {
        id: 'cv6',
        title: 'Sofia Lindgren CV_1',
        tag: 'modern',
        skills: 6,
        jobs: 3,
        updatedAt: 'Mar 01, 2026',
      },
    ],
    portfolio: [
      {
        id: 'p6',
        title: 'Sales Forecasting Model',
        description: 'ML model improving forecast accuracy by 34%.',
        tags: ['Python', 'sklearn', 'Tableau'],
        year: '2025',
        icon: 'tabler:trending-up',
      },
    ],
  },
  {
    id: 'e6',
    firstName: 'Johan',
    lastName: 'Berg Jr',
    email: 'j.bergjr@nordic.se',
    phone: '+46 70 666 77 88',
    title: 'Content Strategist',
    role: '3.Employee',
    status: 'active',
    managerId: 'm2',
    joinedAt: 'Sep 2023',
    jobPlaced: false,
    cvs: [
      {
        id: 'cv7',
        title: 'Johan Berg Jr CV_1',
        tag: 'classic',
        skills: 4,
        jobs: 2,
        updatedAt: 'Feb 20, 2026',
      },
    ],
    portfolio: [],
  },
  {
    id: 'e7',
    firstName: 'Maja',
    lastName: 'Nilsson',
    email: 'm.nilsson@nordic.se',
    phone: '+46 70 777 88 99',
    title: 'SEO Specialist',
    role: '3.Employee',
    status: 'inactive',
    managerId: 'm2',
    joinedAt: 'Nov 2022',
    jobPlaced: true,
    cvs: [
      {
        id: 'cv8',
        title: 'Maja Nilsson CV_2',
        tag: 'modern',
        skills: 8,
        jobs: 7,
        updatedAt: 'Jan 10, 2026',
      },
    ],
    portfolio: [
      {
        id: 'p7',
        title: 'SEO Overhaul',
        description: 'Tripled organic traffic for a retail site in 6 months.',
        tags: ['SEO', 'Analytics', 'Content'],
        year: '2024',
        icon: 'tabler:search',
      },
    ],
  },

  // Manager 3 — Sara Lindqvist (Sales)
  {
    id: 'e8',
    firstName: 'Erik',
    lastName: 'Karlsson',
    email: 'e.karlsson@nordic.se',
    phone: '+46 70 888 99 00',
    title: 'Sales Representative',
    role: '3.Employee',
    status: 'active',
    managerId: 'm3',
    joinedAt: 'Feb 2024',
    jobPlaced: false,
    cvs: [
      {
        id: 'cv9',
        title: 'Erik Karlsson CV_1',
        tag: 'modern',
        skills: 6,
        jobs: 3,
        updatedAt: 'Mar 15, 2026',
      },
    ],
    portfolio: [],
  },
  {
    id: 'e9',
    firstName: 'Klara',
    lastName: 'Åström',
    email: 'k.astrom@nordic.se',
    phone: '+46 70 999 00 11',
    title: 'Account Manager',
    role: '4.Consultant',
    status: 'active',
    managerId: 'm3',
    joinedAt: 'May 2024',
    jobPlaced: true,
    cvs: [
      {
        id: 'cv10',
        title: 'Klara Åström CV_1',
        tag: 'classic',
        skills: 7,
        jobs: 5,
        updatedAt: 'Mar 22, 2026',
      },
    ],
    portfolio: [
      {
        id: 'p8',
        title: 'Client Retention Program',
        description: 'Improved retention by 28% through segmentation.',
        tags: ['CRM', 'Salesforce', 'Analytics'],
        year: '2025',
        icon: 'tabler:heart',
      },
    ],
  },
  {
    id: 'e10',
    firstName: 'Nils',
    lastName: 'Ekberg',
    email: 'n.ekberg@nordic.se',
    phone: '+46 70 100 11 22',
    title: 'Sales Analyst',
    role: '3.Employee',
    status: 'active',
    managerId: 'm3',
    joinedAt: 'Aug 2024',
    jobPlaced: false,
    cvs: [
      {
        id: 'cv11',
        title: 'Nils Ekberg CV_1',
        tag: 'modern',
        skills: 5,
        jobs: 2,
        updatedAt: 'Mar 01, 2026',
      },
    ],
    portfolio: [],
  },

  // Manager 4 — Marcus Eklund (HR) — inactive manager with a few employees
  {
    id: 'e11',
    firstName: 'Petra',
    lastName: 'Strand',
    email: 'p.strand@nordic.se',
    phone: '+46 70 200 22 33',
    title: 'HR Coordinator',
    role: '3.Employee',
    status: 'inactive',
    managerId: 'm4',
    joinedAt: 'Jan 2023',
    jobPlaced: true,
    cvs: [
      {
        id: 'cv12',
        title: 'Petra Strand CV_1',
        tag: 'classic',
        skills: 6,
        jobs: 4,
        updatedAt: 'Dec 15, 2025',
      },
    ],
    portfolio: [],
  },
  {
    id: 'e12',
    firstName: 'David',
    lastName: 'Lund',
    email: 'd.lund@nordic.se',
    phone: '+46 70 300 33 44',
    title: 'Recruiter',
    role: '3.Employee',
    status: 'active',
    managerId: 'm4',
    joinedAt: 'Mar 2023',
    jobPlaced: false,
    cvs: [
      {
        id: 'cv13',
        title: 'David Lund CV_1',
        tag: 'modern',
        skills: 4,
        jobs: 1,
        updatedAt: 'Jan 10, 2026',
      },
    ],
    portfolio: [],
  },
]

/* ── Managers (computed stats) ─────────────────────────────────────────── */
function buildManagers(): Manager[] {
  const groups: Record<
    string,
    {
      name: string
      initials: string
      dept: string
      email: string
      status: 'active' | 'inactive' | 'pending'
      joined: string
    }
  > = {
    m1: {
      name: 'Lena Larsson',
      initials: 'LL',
      dept: 'IT',
      email: 'l.larsson@nordic.se',
      status: 'active',
      joined: 'Jan 2024',
    },
    m2: {
      name: 'Johan Berg',
      initials: 'JB',
      dept: 'Marketing',
      email: 'j.berg@nordic.se',
      status: 'active',
      joined: 'Mar 2024',
    },
    m3: {
      name: 'Sara Lindqvist',
      initials: 'SL',
      dept: 'Sales',
      email: 's.lindqvist@nordic.se',
      status: 'pending',
      joined: 'Apr 2025',
    },
    m4: {
      name: 'Marcus Eklund',
      initials: 'ME',
      dept: 'HR',
      email: 'm.eklund@nordic.se',
      status: 'inactive',
      joined: 'Sep 2023',
    },
  }
  return Object.entries(groups).map(([id, g]) => {
    const emps = EMPLOYEES.filter((e) => e.managerId === id)
    const placed = emps.filter((e) => e.jobPlaced).length
    const cvCount = emps.reduce((acc, e) => acc + e.cvs.length, 0)
    const active = emps.filter((e) => e.status === 'active').length
    const rate =
      emps.length > 0
        ? Math.round(
            (emps.filter((e) => e.cvs.reduce((s, c) => s + c.jobs, 0) > 0).length / emps.length) *
              100,
          ) + '%'
        : '0%'
    return {
      id,
      name: g.name,
      initials: g.initials,
      department: g.dept,
      email: g.email,
      status: g.status,
      joinedAt: g.joined,
      totalEmployees: emps.length,
      activeEmployees: active,
      placed,
      cvCreated: cvCount,
      interviewRate: rate,
    }
  })
}

export const MANAGERS: Manager[] = buildManagers()
