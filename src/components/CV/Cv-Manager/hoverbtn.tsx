import { useState } from "react";
import { Lock } from "lucide-react";
import { useDashboardTranslation } from "@/hooks/useDashboardTranslation";

function HoverButton({ cv, openPublishModal }: any) {
    const [hover, setHover] = useState(false);
    const isPublic = cv.isPublic;
    const { t } = useDashboardTranslation()


    return (
        <button
            onClick={() => openPublishModal(cv)}
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
            className={`
    flex items-center gap-2
    rounded-full border font-bold whitespace-nowrap
    transition-all duration-200 ease-out
    px-3 py-1.5
    ${hover ? "px-4" : "px-3"}
    ${isPublic
                    ? "bg-secondary border-primary text-primary"
                    : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                }
  `}
        >
            {/* Icon */}
            {isPublic ? (
                <div className="h-2 w-2 rounded-full bg-primary animate-pulse shrink-0" />
            ) : (
                <Lock className="h-3 w-3 shrink-0" />
            )}

            {/* Text */}
            <span className="text-[11px] uppercase tracking-wider leading-none">
                {hover
                    ? isPublic
                        ? t.cvMakePrivate
                        : t.cvMakePublic
                    : isPublic
                        ? t.cvPublic
                        : t.cvPrivate
                }
            </span>
        </button>

    );
}

export default HoverButton;
