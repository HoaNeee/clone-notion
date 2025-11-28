import { getValueInLocalStorage } from "@/lib/utils";

export const setLastWorkspaceInLocalStorage = ({
  workspace_id,
  user_id,
}: {
  workspace_id: number;
  user_id: number;
}) => {
  localStorage.setItem(
    "last_object_workspace",
    JSON.stringify({
      workspace_id: workspace_id.toString(),
      user_id: user_id.toString(),
    })
  );
};

export const getLastWorkspaceObjectInLocalStorage = () => {
  const value = getValueInLocalStorage("last_object_workspace");
  if (value) {
    value.workspace_id = Number(value.workspace_id || 0);
    value.user_id = Number(value.user_id || 0);
    return value as {
      workspace_id: number;
      user_id: number;
    };
  }
  return null;
};

export const removeLastWorkspaceInLocalStorage = () => {
  localStorage.removeItem("last_object_workspace");
};
