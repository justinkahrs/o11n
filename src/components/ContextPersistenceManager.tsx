import { useEffect, useRef } from "react";
import { Store } from "@tauri-apps/plugin-store";
import { useAppContext } from "../context/AppContext";
import { useUserContext } from "../context/UserContext";
const ContextPersistenceManager = () => {
  const initialLoadRef = useRef(true);
  const {
    mode,
    instructions,
    customTemplates,
    plan,
    projects,
    selectedFile,
    selectedFiles,
    configFiles,
    setConfigFiles,
    setMode,
    setInstructions,
    setCustomTemplates,
    setPlan,
    setProjects,
    setSelectedFile,
    setSelectedFiles,
  } = useAppContext();
  const {
    showDotfiles,
    includeFileTree,
    countTokens,
    formatOutput,
    loading,
    setShowDotfiles,
    setIncludeFileTree,
    setCountTokens,
    setFormatOutput,
    setLoading,
    primaryColor,
    secondaryColor,
    themeMode,
    onThemeChange,
  } = useUserContext();
  // On application startup, load the saved context and update both contexts.
  useEffect(() => {
    const loadContext = async () => {
      try {
        const store = await Store.load("settings.json", { autoSave: false });
        console.log({ store });
        const storedContext = await store.get("context");
        if (storedContext) {
          // If storedContext is a string, parse it; otherwise assume it's an object.
          const contextObj =
            typeof storedContext === "string"
              ? JSON.parse(storedContext)
              : storedContext;
          if (contextObj.appContext) {
            setMode(contextObj.appContext.mode);
            setInstructions(contextObj.appContext.instructions);
            setCustomTemplates(contextObj.appContext.customTemplates);
            setPlan(contextObj.appContext.plan);
            setProjects(contextObj.appContext.projects);
            setSelectedFiles(contextObj.appContext.selectedFiles);
            setSelectedFile(contextObj.appContext.selectedFile);
            setConfigFiles(contextObj.appContext.configFiles);
          }
          if (contextObj.userContext) {
            setShowDotfiles(contextObj.userContext.showDotfiles);
            setIncludeFileTree(contextObj.userContext.includeFileTree);
            setCountTokens(contextObj.userContext.countTokens);
            setFormatOutput(contextObj.userContext.formatOutput);
            setLoading(contextObj.userContext.loading);
            onThemeChange(
              contextObj.userContext.primaryColor,
              contextObj.userContext.secondaryColor,
              contextObj.userContext.themeMode
            );
          }
        }
      } catch (err) {
        console.error("Error loading context:", err);
      } finally {
        initialLoadRef.current = false;
      }
    };
    loadContext();
  }, [
    setConfigFiles,
    setMode,
    setInstructions,
    setCustomTemplates,
    setPlan,
    setProjects,
    setSelectedFiles,
    setSelectedFile,
    setShowDotfiles,
    setIncludeFileTree,
    setCountTokens,
    setFormatOutput,
    setLoading,
    onThemeChange,
  ]);
  // Save context on app exit using the beforeunload event.
  useEffect(() => {
    const saveContext = async () => {
      try {
        const context = {
          appContext: {
            mode,
            instructions,
            customTemplates,
            plan,
            projects,
            selectedFile,
            selectedFiles,
            configFiles,
          },
          userContext: {
            showDotfiles,
            includeFileTree,
            countTokens,
            formatOutput,
            loading,
            primaryColor,
            secondaryColor,
            themeMode,
          },
        };
        const store = await Store.load("settings.json", { autoSave: false });
        await store.set("context", context);
        await store.save();
      } catch (err) {
        console.error("Error saving context:", err);
      }
    };
    if (!initialLoadRef.current) {
      saveContext();
    }
    window.addEventListener("beforeunload", saveContext);
    return () => {
      window.removeEventListener("beforeunload", saveContext);
    };
  }, [
    configFiles,
    mode,
    instructions,
    customTemplates,
    plan,
    projects,
    selectedFile,
    selectedFiles,
    showDotfiles,
    includeFileTree,
    countTokens,
    formatOutput,
    loading,
    primaryColor,
    secondaryColor,
    themeMode,
  ]);
  return null;
};
export default ContextPersistenceManager;
