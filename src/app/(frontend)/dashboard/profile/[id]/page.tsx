import { authOptions } from "@/authOptions";
import ProfileCreation from "@/components/Profile/profileCreation"
import { getServerSession } from "next-auth/next";
export default async function ProfilePage({
    params,
}: {
    params: Promise<{ id: string }>
}) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
        throw new Error("User session is required"); // or redirect to login
    }
    return (
        <main className="min-h-screen">
            <ProfileCreation
                userId={session.user.id}
                type="edit"
                profileId={(await params).id}
            />
        </main>
    )
}
