import { Home, QrCode, Coins, Award } from "lucide-react";
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
            className={`flex flex-col items-center p-3 min-h-touch ${
              isActive("/demo-stores") ? "text-primary" : "text-gray-400 hover:text-primary"
            }`}
            onClick={() => window.location.href = "/demo-stores"}
          >
            <QrCode className="w-6 h-6 mb-1" />
            <span className="text-sm font-medium">店舗</span>
          </Button>
          
          <Button
            variant="ghost"
            className={`flex flex-col items-center p-3 min-h-touch ${
              isActive("/coin-transfer") ? "text-primary" : "text-gray-400 hover:text-primary"
            }`}
            onClick={() => window.location.href = "/coin-transfer"}
          >
            <Coins className="w-6 h-6 mb-1" />
            <span className="text-sm font-medium">送金</span>
          </Button>
          
          <Button
            variant="ghost"
            className={`flex flex-col items-center p-3 min-h-touch ${
              isActive("/nft-collection") ? "text-primary" : "text-gray-400 hover:text-primary"
            }`}
            onClick={() => window.location.href = "/nft-collection"}
          >
            <Award className="w-6 h-6 mb-1" />
            <span className="text-sm font-medium">NFT</span>
          </Button>
        </div>
      </div>
    </nav>
  );
}
