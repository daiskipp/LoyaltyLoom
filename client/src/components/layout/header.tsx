import { Star, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import HamburgerMenu from "./hamburger-menu";

export default function Header() {
  return (
    <header className="bg-primary shadow-lg sticky top-0 z-40">
      <div className="max-w-md mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <HamburgerMenu />
          
          <div className="flex items-center">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center mr-3">
              <Star className="text-white w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">ロイヤルティ</h1>
              <p className="text-xs text-white/80">ポイントアプリ</p>
            </div>
          </div>

          <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
            <Bell className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
}
