import AppSidebar from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import SidebarLayoutContainer from "@/layouts/sidebar-layout-container";
import { cookies } from "next/dist/server/request/cookies";

export default async function DashboardLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	const token = (await cookies()).get("note_jwt_token")?.value;

	if (!token) {
		return <main className="w-full h-full">{children}</main>;
	}

	return (
		<SidebarProvider>
			<SidebarLayoutContainer>
				<AppSidebar />
				<SidebarInset>
					<main className="w-full h-full">{children}</main>
				</SidebarInset>
			</SidebarLayoutContainer>
		</SidebarProvider>
	);
}
