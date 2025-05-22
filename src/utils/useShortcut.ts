import { useEffect } from "react";
interface ShortcutOptions {
  ctrlKey?: boolean;
  metaKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
}
const useShortcut = (
  key: string,
  callback: (e: KeyboardEvent) => void,
  options: ShortcutOptions = {}
) => {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const keyMatch = e.key.toLowerCase() === key.toLowerCase();
      const ctrlReq = options.ctrlKey ?? false;
      const metaReq = options.metaKey ?? false;
      const shiftReq = options.shiftKey ?? false;
      const altReq = options.altKey ?? false;
      let modifiersOk: boolean;
      if (ctrlReq && metaReq) {
        modifiersOk = e.ctrlKey || e.metaKey;
      } else {
        modifiersOk = true;
        if (ctrlReq) modifiersOk = modifiersOk && e.ctrlKey;
        if (metaReq) modifiersOk = modifiersOk && e.metaKey;
      }
      if (shiftReq) modifiersOk = modifiersOk && e.shiftKey;
      if (altReq) modifiersOk = modifiersOk && e.altKey;
      if (keyMatch && modifiersOk) {
        e.preventDefault();
        callback(e);
      }
    };
    document.addEventListener("keydown", handler);
    return () => {
      document.removeEventListener("keydown", handler);
    };
  }, [
    key,
    callback,
    options.ctrlKey,
    options.metaKey,
    options.shiftKey,
    options.altKey,
  ]);
};
export default useShortcut;
