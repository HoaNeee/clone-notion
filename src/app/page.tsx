import NavigationComponent from "@/components/navigation-component";
import { cookies } from "next/headers";

const DashboardPage = async () => {
	const token = (await cookies()).get("note_jwt_token")?.value;

	//can be handle better with middleware, memo in db to use less query
	if (token) {
		return <NavigationComponent token={token} />;
	}

	return <div className="p-10 w-full h-full relative">Landing Page</div>;
};

export default DashboardPage;
