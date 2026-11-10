import { authOptions } from "@/authOptions";
import ProfileCreation from "@/components/Profile/profileCreation"
import { getServerSession } from "next-auth/next";

export default async function ProfileEdit({
  params,
}: {
  params: Promise<{ profileId: string }>
}) {
  const { profileId } = await params
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.id) {
    throw new Error("User session is required"); // or redirect to login
  }
  return (
    <main className="min-h-screen">
      <ProfileCreation userId={session.user.id.toString()} type="edit" profileId={profileId} />
    </main>
  )
}
