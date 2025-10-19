/* eslint-disable @typescript-eslint/no-explicit-any */

import { isProduction } from "@/lib/utils";
import { post } from "@/utils/request";
import React, { useCallback, useEffect, useState } from "react";

const ResendOTPButton = ({ email }: { email: string }) => {
	const [resent, setResent] = useState(false);
	const [second, setSecond] = useState(isProduction ? 0 : 10);
	const [minute, setMinute] = useState(isProduction ? 3 : 0);

	useEffect(() => {
		let interval: any = null;

		if (resent) {
			interval = setInterval(() => {
				if (second === 0) {
					if (minute === 0) {
						setResent(false);
						clearInterval(interval);
					} else {
						setSecond(59);
						setMinute((prev) => prev - 1);
					}
				} else {
					setSecond((prev) => prev - 1);
				}
			}, 1000);
		} else {
			clearInterval(interval);
		}

		return () => {
			clearInterval(interval);
		};
	}, [second, minute, resent]);

	const handleResent = useCallback(async () => {
		try {
			if (resent) {
				return;
			}
			if (isProduction) {
				setMinute(3);
			} else {
				setSecond(10);
			}
			setResent(true);
			await post("/auth/resend-code", { email });
		} catch (error) {
			console.log(error);
		}
	}, [email, resent]);

	return (
		<div className="text-gray-500 text-sm mt-4">
			<span>{"Don't"} get the code? </span>
			{resent ? (
				<span className="text-gray-400 cursor-not-allowed">
					Send again ({minute.toString().padStart(2, "0")}:
					{second.toString().padStart(2, "0")})
				</span>
			) : (
				<span className="text-blue-800 cursor-pointer" onClick={handleResent}>
					Send again
				</span>
			)}
		</div>
	);
};

export default ResendOTPButton;
