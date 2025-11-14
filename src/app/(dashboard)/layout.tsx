import AppSidebar from "@/components/app-sidebar";
import ReactDragAndDropProvider from "@/contexts/react-dnd-provider";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { FolderContextProvider } from "@/contexts/folder-context";
import { cookies } from "next/dist/server/request/cookies";
import { NoteContext } from "@/contexts/note-context";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const token = (await cookies()).get("note_jwt_token")?.value;

  if (!token) {
    return (
      <SidebarProvider>
        <SidebarInset>
          <main className="w-full h-full">{children}</main>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <NoteContext>
        <FolderContextProvider>
          <ReactDragAndDropProvider>
            <AppSidebar />
          </ReactDragAndDropProvider>
          <SidebarInset>
            <main className="w-full h-full">{children}</main>
          </SidebarInset>
        </FolderContextProvider>
      </NoteContext>
    </SidebarProvider>
  );
}
