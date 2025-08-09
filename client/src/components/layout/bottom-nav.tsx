import { Home, QrCode, History, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

export default function BottomNav() {
  const [location] = useLocation();

  const isActive = (path: string) => {
    if (path === "/" && location === "/") return true;
    if (path !== "/" && location.startsWith(path)) return true;
    return false;
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40">
      <div className="max-w-md mx-auto">
        <div className="flex items-center justify-around py-3">
          <Button
            variant="ghost"
            className={`flex flex-col items-center p-3 min-h-touch ${
              isActive("/") ? "text-primary" : "text-gray-400 hover:text-primary"
            }`}
            onClick={() => window.location.href = "/"}
          >
            <Home className="w-6 h-6 mb-1" />
            <span className="text-sm font-medium">ホーム</span>
          </Button>
          
          <Button
            variant="ghost"
            className="flex flex-col items-center p-3 text-gray-400 hover:text-primary transition-colors min-h-touch"
            onClick={() => {
              // Trigger QR scanner from home page
              window.location.href = "/?action=scan";
            }}
          >
            <QrCode className="w-6 h-6 mb-1" />
            <span className="text-sm font-medium">スキャン</span>
          </Button>
          
          <Button
            variant="ghost"
            className={`flex flex-col items-center p-3 min-h-touch ${
              isActive("/history") ? "text-primary" : "text-gray-400 hover:text-primary"
            }`}
            onClick={() => window.location.href = "/history"}
          >
            <History className="w-6 h-6 mb-1" />
            <span className="text-sm font-medium">履歴</span>
          </Button>
          
          <Button
            variant="ghost"
            className={`flex flex-col items-center p-3 min-h-touch ${
              isActive("/profile") ? "text-primary" : "text-gray-400 hover:text-primary"
            }`}
            onClick={() => window.location.href = "/profile"}
          >
            <User className="w-6 h-6 mb-1" />
            <span className="text-sm font-medium">プロフィール</span>
          </Button>
        </div>
      </div>
    </nav>
  );
}
