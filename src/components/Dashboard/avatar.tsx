import Image from 'next/image';
import { PersonalInformation, ProfileImage } from '@/types/payloadTypes';
import { Media } from '@/payload-types';

interface AvatarProps {
    personalInformation?: PersonalInformation | null;
}

const Avatar = ({ personalInformation }: AvatarProps) => {
    const getProfileImageUrl = (): string | null => {
        if (personalInformation?.profileImage) {
            if ('uploadImage' in personalInformation.profileImage && personalInformation.profileImage.uploadImage) {
                // Ensure you're getting the URL from the 'uploadImage' Media object
                const uploadImage = personalInformation.profileImage.uploadImage;
                return uploadImage ? (uploadImage as { url: string }).url : null;
            }
            if ('staticImage' in personalInformation.profileImage && personalInformation.profileImage.staticImage) {
                return personalInformation.profileImage.staticImage;
            }
        }
        return null;
    };

    const imageUrl = getProfileImageUrl();

    if (imageUrl) {
        return (
            <Image
                src={imageUrl}
                width={32}
                height={32}
                className="w-8 h-8 rounded-full"
                alt="User Avatar"
                priority
            />
        );
    } else {
        return (
            <div
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ backgroundColor: '#2b59c3' }}
            >
                {personalInformation?.firstName && personalInformation?.lastName ? (
                    <span className="text-xs font-semibold text-white">
                        {personalInformation.firstName.charAt(0)}
                        {personalInformation.lastName.charAt(0)}
                    </span>
                ) : (
                    <span className="text-xs font-semibold text-white">
                        ?
                    </span>
                )}
            </div>
        );
    }
};

export default Avatar;
