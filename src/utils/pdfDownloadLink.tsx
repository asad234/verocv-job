import ATSResumeTemplate from "@/components/CV/PdfViewer/ATS-Template";
import ClassicResumeTemplate from "@/components/CV/PdfViewer/ClassicTemplate";
import MinimalistResumeTemplate from "@/components/CV/PdfViewer/MinimalistTemplate";
import ModernResumeTemplate from "@/components/CV/PdfViewer/ModernTemplate";
import KonsultResumeTemplate from "@/components/CV/PdfViewer/Konsulttemplate";
import { pdf } from "@react-pdf/renderer";
import { CVData } from "@/utils/types";
import {
  DEFAULT_ACCENT_COLOR,
  DEFAULT_HEADING_FONT,
  DEFAULT_BODY_FONT,
} from "@/components/CV/PdfViewer/Cvfontregistry";
import { dashboardTranslations } from '@/utils/dashboardTranslations';
import type { PortfolioItem } from "@/components/CV/PdfViewer/ModernTemplate";

export const downloadCvPdf = async ({
  template,
  cvData,
  visibility,
  toast,
  accentColor = DEFAULT_ACCENT_COLOR,
  headingFont = DEFAULT_HEADING_FONT,
  bodyFont = DEFAULT_BODY_FONT,
  sidebarColor = '#172A45',
  locale = 'en',
  portfolioItems,
}: {
  template: string;
  cvData: CVData;
  visibility: any;
  toast: (args: any) => void;
  accentColor?: string;
  headingFont?: string;
  bodyFont?: string;
  sidebarColor?: string;
  locale?: 'en' | 'sv';
  portfolioItems?: PortfolioItem[];
}) => {
  try {
    toast({
      title: "Generating PDF",
      description: "Creating your CV document...",
    });

    const translations = (dashboardTranslations[locale] ?? dashboardTranslations.en) as typeof dashboardTranslations['en'];
    const styleProps = { accentColor, headingFont, bodyFont };

    let element;

    switch (template) {
      case "minimalist":
        element = <MinimalistResumeTemplate data={cvData} visibility={visibility} translations={translations} {...styleProps} />;
        break;
      case "classic":
        element = <ClassicResumeTemplate data={cvData} visibility={visibility} translations={translations} {...styleProps} />;
        break;
      case "ats":
        element = <ATSResumeTemplate data={cvData} visibility={visibility} {...styleProps} />;
        break;
      case "konsult":
        element = <KonsultResumeTemplate data={cvData} visibility={visibility} translations={translations} {...styleProps} />;
        break;
      case "modern":
      default:
        element = (
          <ModernResumeTemplate
            data={cvData}
            visibility={visibility}
            translations={translations}
            portfolioItems={portfolioItems}
            {...styleProps}
          />
        );
        break;
    }

    const blob = await pdf(element).toBlob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    const fileName = `${cvData.personalInfo?.firstName || "cv"}_${cvData.personalInfo?.lastName || ""}_${template}_cv.pdf`
      .replace(/ /g, "_")
      .toLowerCase();

    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: "Download Started",
      description: "Your CV PDF is being downloaded",
    });
  } catch (error) {
    console.error("Failed to generate PDF:", error);
    toast({
      title: "Download Failed",
      description: "Could not generate PDF file",
      variant: "destructive",
    });
    throw error;
  }
};
