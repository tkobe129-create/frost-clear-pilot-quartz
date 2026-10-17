import { createRoot } from "react-dom/client";
import { GitHubPagesRoot } from "@/github-main";

const root = document.getElementById("root");
if (!root) throw new Error("Application root element not found");

createRoot(root).render(<GitHubPagesRoot />);
