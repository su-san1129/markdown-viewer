import { Allotment } from "allotment";
import { Toolbar } from "./components/Toolbar";
import { Sidebar } from "./components/Sidebar";
import { MarkdownViewer } from "./components/MarkdownViewer";

function App() {
  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden">
      <Toolbar />
      <div className="flex-1 min-h-0">
        <Allotment defaultSizes={[250, 750]}>
          <Allotment.Pane minSize={180} maxSize={500}>
            <Sidebar />
          </Allotment.Pane>
          <Allotment.Pane>
            <MarkdownViewer />
          </Allotment.Pane>
        </Allotment>
      </div>
    </div>
  );
}

export default App;
