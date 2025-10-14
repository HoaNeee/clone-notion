import AppSidebar from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import SidebarLayoutContainer from "@/layouts/sidebar-layout-container";

export default function DashboardLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
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
