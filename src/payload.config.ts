// storage-adapter-import-placeholder
import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import sharp from 'sharp' // sharp-import
import path from 'path'
import { buildConfig, PayloadRequest } from 'payload'
import { fileURLToPath } from 'url'
import { s3Storage } from '@payloadcms/storage-s3'
import { Media } from './collections/Media'
import { Users } from './collections/Users'
import Job from './collections/Job'
import Menus from './collections/Menu/Menu'
import MenuItems from './collections/Menu/MenuItems'
import JobApplications from './collections/JobApplications'
import { Profiles } from './collections/Profile'
import PersonalInformation from './collections/PersonalInformation'
import Availability from './collections/Availability'
import EmploymentDetails from './collections/EmploymentDetailts'
import CVs from './collections/Cvs'
import { CoverLetters } from './collections/CoverLetters'
import PortfolioItems from './collections/Portfolio'
import BusinessAdminInfo from './collections/Businessadmininfo'
import ManagerInfo from './collections/Managerinfo'
import EmployeeInvitations from './collections/Employeeinvitations'
import EmployeeHrInfo from './collections/Employeehrinfo'
import EmployeeContracts from './collections/EmployeeContracts'
import { ContractTemplates } from './collections/ContractTemplates'
import ContractPdfs from './collections/ContractPdfs'
import { ContractDocuments } from './collections/ContractDocuments'
import GoogleCalendarConnection from './collections/GoogleCalendarConnections'
import { Interviews } from './collections/Interviews'
import ManagerDelegations from './collections/ManagerDelegations'
import ChatMessages from './collections/ChatMessages'
import ChatConversations from './collections/ChatConversations'
import UserPresence from './collections/UserPresence'
import ManagerDeletions from './collections/ManagerDeletions'
import ManagerAvailability from './collections/ManagerAvailability'
import TimeOffRequests from './collections/TimeOffRequests'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  serverURL: process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000',
  admin: {
    importMap: {
      baseDir: path.resolve(dirname),
    },
    user: Users.slug,
    livePreview: {
      breakpoints: [
        {
          label: 'Mobile',
          name: 'mobile',
          width: 375,
          height: 667,
        },
        {
          label: 'Tablet',
          name: 'tablet',
          width: 768,
          height: 1024,
        },
        {
          label: 'Desktop',
          name: 'desktop',
          width: 1440,
          height: 900,
        },
      ],
    },
  },
  // This config helps us configure global or default features that the other editors can inherit
  editor: lexicalEditor(),
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URI || '',
    },
  }),
  collections: [
    Job,
    JobApplications,
    Profiles,
    PersonalInformation,
    BusinessAdminInfo,
    ManagerInfo,
    Availability,
    EmploymentDetails,
    CVs,
    CoverLetters,
    PortfolioItems,
    Media,
    Users,
    Menus,
    MenuItems,
    EmployeeInvitations,
    EmployeeHrInfo,
    EmployeeContracts,
    ContractTemplates,
    ContractPdfs,
    ContractDocuments,
    GoogleCalendarConnection,
    Interviews,
    ManagerDelegations,
    ChatMessages,
    ChatConversations,
    UserPresence,
    ManagerDeletions,
    ManagerAvailability,
    TimeOffRequests,
  ],
  secret: process.env.PAYLOAD_SECRET,
  sharp,
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  graphQL: {
    disable: false,
  },
  jobs: {
    access: {
      run: ({ req }: { req: PayloadRequest }): boolean => {
        // Allow logged in users to execute this endpoint (default)
        if (req.user) return true

        // If there is no logged in user, then check
        // for the Vercel Cron secret to be present as an
        // Authorization header:
        const authHeader = req.headers.get('authorization')
        return authHeader === `Bearer ${process.env.CRON_SECRET}`
      },
    },
    tasks: [],
  },
  csrf: [
    'https://job-portal-website-ten.vercel.app', // staging
    'https://verocv.se', // production (note: removed trailing slash)
    process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000', // local development
  ],
  plugins: [
    // storage-adapter-placeholder
    s3Storage({
      collections: {
        media: {
          prefix: 'media',
        },
      },
      bucket: process.env.S3_BUCKET || '',
      config: {
        forcePathStyle: true,
        credentials: {
          accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
          secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
        },
        region: process.env.S3_REGION,
        endpoint: process.env.S3_ENDPOINT,
      },
    }),
  ],
})
