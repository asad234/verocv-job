import { Icon } from "@iconify/react"
import CVCard from "../ReUsable/CVCard"
import Link from "next/link"
import Card from "../ReUsable/Card"
import TechnicalSkills from "./technicalSkills"
import TodoSection from "./todoSection"
import FeedbackForm from "./feedback"
import { useDashboardTranslations } from "@/hooks/useDashboardTranslation"
import ComingSoonDialog from "@/components/Common/applyForJobsPop-Up"

const DashboardHomePage = () => {
  const { t } = useDashboardTranslations()

  return (
    <div className="p-4 sm:p-6 m-2 sm:m-4 min-h-screen">
      {/* Welcome Section */}
      <div className="mb-6 text-center mx-auto w-full md:w-[80%] lg:w-[60%]">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800">{t.welcomeTitle}</h1>
        <p className="text-gray-600 mt-2 text-sm sm:text-base">{t.welcomeSubtitle}</p>
      </div>
      <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 h-full">
        {/* Left Side */}
        <div className="w-full lg:w-[60%] space-y-4 sm:space-y-6 flex-grow">
          {/* Get Started Section */}
          <Card className="p-6">
            {/* Title with Primary Theme */}
            <div className="flex items-center justify-center gap-3 mb-6">
              <div
                className="p-2 rounded-lg"
                style={{ backgroundColor: 'rgb(5, 22, 80)' }}
              >
                <Icon icon="tabler:rocket" className="w-6 h-6 text-white" />
              </div>
              <h2
                className="text-xl font-bold"
                style={{ color: 'rgb(5, 22, 80)' }}
              >
                {t.getStarted}
              </h2>
            </div>
            {/* Steps Container */}
            <div className="space-y-4">
              {/* Step 1 */}
              <Link
                href="/dashboard/settings/account"
                className="group flex items-center gap-4 p-4 rounded-xl border border-gray-200 transition-all"
                style={{
                  '--hover-border': 'rgb(176, 196, 222)',
                  '--hover-bg': 'rgb(176, 196, 222, 0.1)',
                } as React.CSSProperties}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'rgb(176, 196, 222)'
                  e.currentTarget.style.backgroundColor = 'rgba(176, 196, 222, 0.1)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = ''
                  e.currentTarget.style.backgroundColor = ''
                }}
              >
                <div
                  className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: 'rgb(176, 196, 222, 0.3)' }}
                >
                  <span
                    className="font-bold"
                    style={{ color: 'rgb(5, 22, 80)' }}
                  >
                    1
                  </span>
                </div>
                <div className="flex-1">
                  <h3
                    className="font-semibold text-gray-800 group-hover:transition-colors"
                    onMouseEnter={(e) => e.currentTarget.style.color = 'rgb(5, 22, 80)'}
                    onMouseLeave={(e) => e.currentTarget.style.color = ''}
                  >
                    {t.step1Title}
                  </h3>
                  <p className="text-sm text-gray-500">{t.step1Description}</p>
                </div>
                <Icon
                  icon="tabler:chevron-right"
                  className="w-5 h-5 text-gray-400"
                  style={{ '--hover-color': 'rgb(5, 22, 80)' } as React.CSSProperties}
                  onMouseEnter={(e) => {
                    const target = e.currentTarget as SVGElement
                    target.style.color = 'rgb(5, 22, 80)'
                  }}
                  onMouseLeave={(e) => {
                    const target = e.currentTarget as SVGElement
                    target.style.color = ''
                  }}
                />
              </Link>
              {/* Step 2 */}
              <Link
                href="/dashboard/profile"
                className="group flex items-center gap-4 p-4 rounded-xl border border-gray-200 transition-all"
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'rgb(156, 177, 202)'
                  e.currentTarget.style.backgroundColor = 'rgba(156, 177, 202, 0.1)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = ''
                  e.currentTarget.style.backgroundColor = ''
                }}
              >
                <div
                  className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: 'rgb(156, 177, 202, 0.3)' }}
                >
                  <span
                    className="font-bold"
                    style={{ color: 'rgb(5, 22, 80)' }}
                  >
                    2
                  </span>
                </div>
                <div className="flex-1">
                  <h3
                    className="font-semibold text-gray-800 group-hover:transition-colors"
                    onMouseEnter={(e) => e.currentTarget.style.color = 'rgb(5, 22, 80)'}
                    onMouseLeave={(e) => e.currentTarget.style.color = ''}
                  >
                    {t.step2Title}
                  </h3>
                  <p className="text-sm text-gray-500">{t.step2Description}</p>
                </div>
                <Icon
                  icon="tabler:chevron-right"
                  className="w-5 h-5 text-gray-400"
                  onMouseEnter={(e) => {
                    const target = e.currentTarget as SVGElement
                    target.style.color = 'rgb(5, 22, 80)'
                  }}
                  onMouseLeave={(e) => {
                    const target = e.currentTarget as SVGElement
                    target.style.color = ''
                  }}
                />
              </Link>
              {/* Step 3 */}
              <Link
                href="/dashboard/cv/edit"
                className="group flex items-center gap-4 p-4 rounded-xl border border-gray-200 transition-all"
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'rgb(176, 196, 222)'
                  e.currentTarget.style.backgroundColor = 'rgba(176, 196, 222, 0.1)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = ''
                  e.currentTarget.style.backgroundColor = ''
                }}
              >
                <div
                  className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: 'rgb(176, 196, 222, 0.3)' }}
                >
                  <span
                    className="font-bold"
                    style={{ color: 'rgb(5, 22, 80)' }}
                  >
                    3
                  </span>
                </div>
                <div className="flex-1">
                  <h3
                    className="font-semibold text-gray-800 group-hover:transition-colors"
                    onMouseEnter={(e) => e.currentTarget.style.color = 'rgb(5, 22, 80)'}
                    onMouseLeave={(e) => e.currentTarget.style.color = ''}
                  >
                    {t.step3Title}
                  </h3>
                  <p className="text-sm text-gray-500">{t.step3Description}</p>
                </div>
                <Icon
                  icon="tabler:chevron-right"
                  className="w-5 h-5 text-gray-400"
                  onMouseEnter={(e) => {
                    const target = e.currentTarget as SVGElement
                    target.style.color = 'rgb(5, 22, 80)'
                  }}
                  onMouseLeave={(e) => {
                    const target = e.currentTarget as SVGElement
                    target.style.color = ''
                  }}
                />
              </Link>
              {/* Step 4 - Apply for Jobs with Coming Soon Dialog */}
              <ComingSoonDialog
                trigger={
                  <div
                    className="group flex items-center gap-4 p-4 rounded-xl border border-gray-200 transition-all cursor-pointer"
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'rgb(156, 177, 202)'
                      e.currentTarget.style.backgroundColor = 'rgba(156, 177, 202, 0.1)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = ''
                      e.currentTarget.style.backgroundColor = ''
                    }}
                  >
                    <div
                      className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: 'rgb(156, 177, 202, 0.3)' }}
                    >
                      <span
                        className="font-bold"
                        style={{ color: 'rgb(5, 22, 80)' }}
                      >
                        4
                      </span>
                    </div>
                    <div className="flex-1">
                      <h3
                        className="font-semibold text-gray-800 group-hover:transition-colors"
                        onMouseEnter={(e) => e.currentTarget.style.color = 'rgb(5, 22, 80)'}
                        onMouseLeave={(e) => e.currentTarget.style.color = ''}
                      >
                        {t.step4Title}
                      </h3>
                      <p className="text-sm text-gray-500">{t.step4Description}</p>
                    </div>
                    <Icon
                      icon="tabler:chevron-right"
                      className="w-5 h-5 text-gray-400"
                      onMouseEnter={(e) => {
                        const target = e.currentTarget as SVGElement
                        target.style.color = 'rgb(5, 22, 80)'
                      }}
                      onMouseLeave={(e) => {
                        const target = e.currentTarget as SVGElement
                        target.style.color = ''
                      }}
                    />
                  </div>
                }
              />
            </div>
            {/* Completion CTA */}
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-500">{t.completionMessage}</p>
            </div>
          </Card>
          {/* Latest Requests */}
          <TodoSection />
        </div>
        {/* Right Side */}
        <div className="w-full lg:w-[40%] space-y-4 sm:space-y-6 flex-grow">
          <TechnicalSkills />
          <CVCard />
          <FeedbackForm />
        </div>
      </div>
    </div>
  )
}

export default DashboardHomePage
