'use client';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { pdf } from '@react-pdf/renderer';
import MinimalistTemplate from './MinimalistTemplate';
import ModernTemplate from './ModernTemplate';
import ClassicTemplate from './ClassicTemplate';
import ATSResumeTemplate from './ATS-Template';
import KonsultResumeTemplate from './Konsulttemplate';
import { CVData, SectionVisibility } from '@/utils/types';
import {
  HEADING_FONT_ID_TO_PDF,
  BODY_FONT_ID_TO_PDF,
  DEFAULT_HEADING_FONT,
  DEFAULT_BODY_FONT,
  DEFAULT_ACCENT_COLOR,
  registerCvFonts,
} from './Cvfontregistry';
import { useDashboardTranslations } from '@/hooks/useDashboardTranslation';
import type { PortfolioItem } from './ModernTemplate';

export interface LivePdfPreviewProps {
  cvData: CVData;
  visibility: SectionVisibility;
  template: 'minimalist' | 'modern' | 'classic' | 'ats' | 'konsult';
  accentColor?: string;
  headingFontId?: string;
  bodyFontId?: string;
  showToolbar?: boolean;
  fullScreen?: boolean;
  className?: string;
  sidebarColor?: string;
  /** Portfolio items to embed as clickable mini-cards in the PDF */
  portfolioItems?: PortfolioItem[];
}

const DEBOUNCE_DELAY = 700;

const LivePdfPreview: React.FC<LivePdfPreviewProps> = ({
  cvData,
  visibility,
  template,
  accentColor = DEFAULT_ACCENT_COLOR,
  headingFontId = 'montserrat',
  bodyFontId = 'inter',
  showToolbar = false,
  fullScreen = false,
  className = '',
  portfolioItems,
}) => {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const currentGenerationRef = useRef<number>(0);
  const [fontsReady, setFontsReady] = useState(false);

  const { t } = useDashboardTranslations();

  useEffect(() => {
    let mounted = true;
    registerCvFonts().then(() => { if (mounted) setFontsReady(true); });
    return () => { mounted = false; };
  }, []);

  const headingFont = HEADING_FONT_ID_TO_PDF[headingFontId] ?? DEFAULT_HEADING_FONT;
  const bodyFont = BODY_FONT_ID_TO_PDF[bodyFontId] ?? DEFAULT_BODY_FONT;

  const pdfDisplayUrl = pdfUrl
    ? `${pdfUrl}${showToolbar ? '' : '#toolbar=0'}`
    : null;

  // ── Template renderer ─────────────────────────────────────────
  const renderTemplate = useCallback(() => {
    const styleProps = { accentColor, headingFont, bodyFont };

    switch (template) {
      case 'minimalist':
        return (
          <MinimalistTemplate
            data={cvData}
            visibility={visibility}
            translations={t}
            {...styleProps}
            portfolioItems={portfolioItems}
          />
        );
      case 'classic':
        return (
          <ClassicTemplate
            data={cvData}
            visibility={visibility}
            translations={t}
            {...styleProps}
            portfolioItems={portfolioItems}
          />
        );
      case 'ats':
        return (
          <ATSResumeTemplate
            data={cvData}
            visibility={visibility}
            {...styleProps}
          />
        );
      case 'konsult':
        return (
          <KonsultResumeTemplate
            data={cvData}
            visibility={visibility}
            translations={t}
            {...styleProps}
            portfolioItems={portfolioItems}
          />
        );
      case 'modern':
      default:
        return (
          <ModernTemplate
            data={cvData}
            visibility={visibility}
            translations={t}
            portfolioItems={portfolioItems}
            {...styleProps}
          />
        );
    }
  }, [cvData, visibility, template, accentColor, headingFont, bodyFont, t, portfolioItems]);

  // ── PDF generation with debounce ───────────────────────────────
  useEffect(() => {
    const generationId = ++currentGenerationRef.current;
    let isMounted = true;

    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

    debounceTimerRef.current = setTimeout(async () => {
      if (!isMounted) return;
      setIsGenerating(true);
      setError(null);
      let newUrl: string | null = null;

      try {
        const blob = await pdf(renderTemplate()).toBlob();
        if (!isMounted || generationId !== currentGenerationRef.current) return;

        newUrl = URL.createObjectURL(blob);
        setPdfUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return newUrl;
        });
      } catch (err) {
        console.error('PDF preview generation failed:', err);
        if (newUrl) URL.revokeObjectURL(newUrl);
        if (isMounted) setError(String(err));
      } finally {
        if (isMounted && generationId === currentGenerationRef.current) {
          setIsGenerating(false);
        }
      }
    }, DEBOUNCE_DELAY);

    return () => {
      isMounted = false;
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [renderTemplate, fontsReady]);

  // ── Cleanup blob URL on unmount ────────────────────────────────
  useEffect(() => {
    return () => { if (pdfUrl) URL.revokeObjectURL(pdfUrl); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const wrapperClass =
    `${fullScreen ? 'fixed inset-0 z-[9999]' : ''} h-full w-full rounded-lg border ` +
    `border-gray-200 bg-white shadow-sm overflow-hidden ${className}`;

  return (
    <div className={wrapperClass}>
      <div className="relative h-full w-full">

        {/* Error state */}
        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-6 text-center">
            <p className="text-sm font-medium text-red-600">Preview failed to generate</p>
            <p className="text-xs text-gray-500">{error}</p>
          </div>
        )}

        {/* Generating skeleton */}
        {isGenerating && (
          <div className="absolute inset-0 h-full p-8 bg-gradient-to-b from-gray-50 to-white z-10">
            <div className="max-w-3xl mx-auto space-y-6 animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-1/3" />
              <div className="h-3 bg-gray-100 rounded-full w-2/3" />
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="space-y-2">
                  <div className="h-5 bg-gray-200 rounded w-1/5" />
                  <div className="h-3 bg-gray-100 rounded-full w-full" />
                  <div className="h-3 bg-gray-100 rounded-full w-4/5" />
                  <div className="h-3 bg-gray-100 rounded-full w-3/5" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PDF iframe */}
        {pdfDisplayUrl && !error && (
          <iframe
            ref={iframeRef}
            src={pdfDisplayUrl}
            width="100%"
            height="100%"
            className="border-0"
            title="CV Preview"
          />
        )}

        {/* Initial empty state */}
        {!pdfDisplayUrl && !isGenerating && !error && (
          <div className="h-full p-8 bg-gradient-to-b from-gray-50 to-white">
            <div className="max-w-3xl mx-auto space-y-6 animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-1/3" />
              {[1, 2, 3].map((i) => (
                <div key={i} className="space-y-2">
                  <div className="h-5 bg-gray-200 rounded w-1/5" />
                  <div className="h-3 bg-gray-100 rounded-full w-full" />
                  <div className="h-3 bg-gray-100 rounded-full w-4/5" />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LivePdfPreview;
