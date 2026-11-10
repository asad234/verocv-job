"use client"

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Card from "./Card";
import { Icon } from "@iconify/react";
import { CVData } from "@/utils/types";

interface CVCardProps {
  buttonText?: string;
  hideTitle?: boolean;
  onClick?: () => void;
}

const CVCard: React.FC<CVCardProps> = ({
  buttonText = "Create",
  hideTitle = false,
  onClick
}) => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [latestCV, setLatestCV] = useState<CVData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLatestCV = async () => {
      if (status !== "authenticated" || !session?.user?.id) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/cv?userId=${session.user.id}`);
        const result = await response.json();

        if (response.ok && result.success && result.data.length > 0) {
          // Sort by updatedAt and get the most recent
          const sorted = result.data.sort((a: CVData, b: CVData) => {
            return new Date(b.updatedAt!).getTime() - new Date(a.updatedAt!).getTime();
          });
          setLatestCV(sorted[0]);
        }
      } catch (error) {
        console.error("Error fetching latest CV:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLatestCV();
  }, [status, session?.user?.id]);

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (latestCV) {
      // If CV exists, go to edit page
      router.push(`/dashboard/cv/edit/${latestCV.id}`);
    } else {
      // If no CV exists, go to CV dashboard
      router.push("/dashboard/cv");
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  const getRelativeTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

      if (diffInHours < 1) return "Just now";
      if (diffInHours < 24) return `${Math.floor(diffInHours)} hours ago`;
      if (diffInHours < 168) return `${Math.floor(diffInHours / 24)} days ago`;
      return formatDate(dateString);
    } catch {
      return dateString;
    }
  };

  if (loading) {
    return (
      <Card>
        {!hideTitle && (
          <div className="flex items-center gap-2 text-black font-medium">
            <h2>Recently updated CVs</h2>
          </div>
        )}
        <div className="mt-4 flex justify-center py-8">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent" />
        </div>
      </Card>
    );
  }

  return (
    <Card>
      {!hideTitle && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-black font-medium">
            <h2>Recently updated CVs</h2>
          </div>
          <Icon
            icon="tabler:plus"
            className="w-5 h-5 cursor-pointer hover:scale-110 transition-transform"
            style={{ color: 'rgb(5, 22, 80)' }}
            onClick={() => router.push("/dashboard/cv")}
          />
        </div>
      )}

      {latestCV ? (
        <div
          className="mt-4 cursor-pointer hover:bg-gray-50 rounded-lg p-4 transition-all border border-transparent hover:border-gray-200"
          onClick={handleClick}
        >
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg truncate text-gray-900">
                {latestCV.name}
              </h3>
              <p className="text-sm text-gray-600 truncate mt-1">
                {latestCV.personalInfo?.title || "No title specified"}
              </p>
            </div>
            <div
              className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-md ml-2 flex-shrink-0"
            >
              {latestCV.template || "modern"}
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
            <Icon icon="tabler:user" className="w-4 h-4" />
            <span className="truncate">
              {latestCV.personalInfo?.firstName} {latestCV.personalInfo?.lastName}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
            <div className="flex items-center gap-1">
              <Icon icon="tabler:clock" className="w-3 h-3" />
              <span>{getRelativeTime(latestCV.updatedAt!)}</span>
            </div>
            <div className="flex gap-2">
              {latestCV.skills && latestCV.skills.length > 0 && (
                <span className="px-2 py-1 bg-gray-100 rounded text-gray-700">
                  {latestCV.skills.filter(s => s.visible !== false).length} skills
                </span>
              )}
              {latestCV.experience && latestCV.experience.length > 0 && (
                <span className="px-2 py-1 bg-gray-100 rounded text-gray-700">
                  {latestCV.experience.filter(e => e.visible !== false).length} jobs
                </span>
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-gray-200">
            <button
              className="w-full px-4 py-2 rounded-lg text-white font-medium transition-all duration-300 hover:shadow-md flex items-center justify-center gap-2"
              style={{ backgroundColor: 'rgb(5, 22, 80)' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgb(15, 32, 90)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgb(5, 22, 80)';
              }}
              onClick={(e) => {
                e.stopPropagation();
                handleClick();
              }}
            >
              <Icon icon="tabler:edit" className="w-4 h-4" />
              <span>Edit CV</span>
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="mt-4 flex flex-col items-center justify-center py-4">
            <div className="relative w-42 sm:w-40 h-18 sm:h-20 bg-gray-100 rounded-md flex items-center justify-center">
              <span className="text-gray-400">••••••••••</span>
              <div
                className="absolute -bottom-2 -right-2 w-8 h-8 bg-white border rounded-full flex items-center justify-center shadow-sm"
                style={{ borderColor: 'rgb(176, 196, 222)' }}
              >
                <Icon
                  icon="tabler:plus"
                  className="w-5 h-5"
                  style={{ color: 'rgb(5, 22, 80)' }}
                />
              </div>
            </div>
            <p className="text-gray-600 mt-3 text-sm">There are no CVs</p>
          </div>

          <div className="mt-4 flex justify-center">
            <button
              onClick={handleClick}
              className="px-6 py-3 rounded-xl text-white font-medium transition-all duration-300 hover:shadow-lg"
              style={{ backgroundColor: 'rgb(5, 22, 80)' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgb(15, 32, 90)';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgb(5, 22, 80)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              {buttonText}
            </button>
          </div>
        </>
      )}
    </Card>
  );
};

export default CVCard;
