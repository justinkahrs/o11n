import { invoke } from "@tauri-apps/api/core";
import { useUserContext } from "../context/UserContext";
import type { TreeItemData } from "../types";
import { useCallback } from "react";
export const useFS = () => {
  const { useIgnoreFiles } = useUserContext();
  const getChildren = useCallback(
    async (path: string, showDotfiles: boolean) =>
      invoke<TreeItemData[]>("list_directory", {
        path,
        showDotfiles,
        useIgnoreFile: useIgnoreFiles,
      }),
    [useIgnoreFiles]
  );
  const search = useCallback(
    async (root: string, needle: string) =>
      invoke<TreeItemData[]>("search_files", {
        root,
        needle,
        useIgnoreFile: useIgnoreFiles,
      }),
    [useIgnoreFiles]
  );
  const watch = useCallback(
    async (root: string) => invoke("start_watch", { path: root }),
    []
  );
  return { getChildren, search, watch };
};
