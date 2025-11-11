export type TRequest = {
	id: number;
	sender_id: number;
	receiver_id: number;
	request_type: TRequestType;
	status: TRequestStatus;
	is_read: number;
	deleted: number;
	createdAt: string;
	updatedAt: string;
	request_id: number;
	ref_type: TRequestRefType;
	ref_id: number;
	ref_extra: string | null;
	ref_link: string | null;
	type_action: TRequestTypeAction;
	message: string | null;
	sender_info: UserInfo;
	receiver_info: UserInfo;
	ref_data_info: RefDataInfo | null;
};

type TRequestRefType = "note" | "workspace";
type TRequestStatus = "pending" | "accepted" | "rejected";
type TRequestTypeAction = "send" | "receive" | "other";
type TRequestType = "invite" | "request";

type UserInfo = {
	id: number;
	fullname: string;
	email: string;
	avatar: string | null;
};

type RefDataInfo = {
	id: number;
	title: string;
};
