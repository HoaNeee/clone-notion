import StartingPage from "@/components/starting-page";
import { logAction } from "@/lib/utils";
import { TNote } from "@/types/note.type";
import { get } from "@/utils/request";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const getDefaultNote = async (token: string) => {
  try {
    const res = await get(`/notes/default`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });

    if (res) {
      return res as TNote;
    }
    return null;
  } catch (error) {
    logAction(error);
    return null;
  }
};

const DashboardPage = async () => {
  const token = (await cookies()).get("note_jwt_token")?.value;

  if (token) {
    const defaultNote = await getDefaultNote(token);
    if (defaultNote) {
      return redirect(`/${defaultNote.slug}`);
    } else {
      return <StartingPage />;
    }
  }

  return <div className="p-10 w-full h-full relative">Landing Page</div>;
};

export default DashboardPage;
