import { authOptions } from "@/authOptions";
import ProfileCreation from "@/components/Profile/profileCreation"
import { getServerSession } from "next-auth";

export default async function ProfileCreate() {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
        throw new Error("User session is required"); // or redirect to login
    }
    return (
        <main className="min-h-screen">
            <ProfileCreation userId={session.user.id} type="create" />
        </main>
    )
}