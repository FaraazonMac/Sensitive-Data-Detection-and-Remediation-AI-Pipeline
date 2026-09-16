import { TopNav } from "@/components/layout/TopNav";
import { AmbientBackground } from "@/components/layout/AmbientBackground";
import { ScanPage } from "@/pages/ScanPage";

export default function App() {
  return (
    <div className="relative min-h-screen bg-ink-navy">
      <AmbientBackground />
      <div className="relative z-10">
        <TopNav />
        <ScanPage />
      </div>
    </div>
  );
}
