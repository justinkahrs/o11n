import { useState, useRef } from "react";
import FileExplorer from "./components/FileExplorer";
import FilePreviewModal from "./components/FilePreviewModal";

import "./App.css";
import { Providers } from "./components/Providers";
import SettingsMenu from "./components/SettingsMenu";
import RightPanel from "./components/RightPanel";
import VerticalSeparator from "./components/VerticalSeparator";

function App() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [explorerWidth, setExplorerWidth] = useState(300);

  // New state for adjustable FileExplorer width and dragging status.
  // const projectsRef = useRef(projects);
  // const selectedFilesRef = useRef(selectedFiles);
  // useEffect(() => {
  //   projectsRef.current = projects;
  // }, [projects]);
  // useEffect(() => {
  //   selectedFilesRef.current = selectedFiles;
  // }, [selectedFiles]);

  return (
    <Providers>
      <div
        ref={containerRef}
        style={{ display: "flex", height: "100vh", padding: "16px" }}
      >
        {/* Left Panel: FileExplorer wrapped in a fixed-width container */}
        <div style={{ width: explorerWidth, overflow: "auto", flexShrink: 0 }}>
          <FileExplorer />
          <SettingsMenu />
        </div>
        <VerticalSeparator
          containerRef={containerRef}
          setExplorerWidth={setExplorerWidth}
        />
        <RightPanel />
      </div>
      <FilePreviewModal />
    </Providers>
  );
}
export default App;
