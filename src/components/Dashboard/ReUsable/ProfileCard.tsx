import React, { ReactNode } from "react";

interface ProfileCardProps {
    children: ReactNode;
    className?: string;
    onClick?: () => void;
}

const ProfileCard: React.FC<ProfileCardProps> = ({ children, className = "" }) => {
    return (

        <div className={`border border-gray-200 rounded-xl p-4 sm:p-6 bg-white shadow-sm ${className}`}>
            {children}
        </div>
    );
};

export default ProfileCard;
