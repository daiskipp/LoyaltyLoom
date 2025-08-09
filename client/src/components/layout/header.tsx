import { Star, Bell, User } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Header() {
  return (
    <header className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-40">
      <div className="max-w-md mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center mr-4">
              <Star className="text-white w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-text">ロイヤルティ</h1>
              <p className="text-sm text-gray-600">ポイントアプリ</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Button variant="ghost" className="w-10 h-10 p-0">
              <Bell className="text-gray-400 w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              className="w-10 h-10 p-0"
              onClick={() => window.location.href = "/profile"}
            >
              <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                <User className="text-gray-500 w-5 h-5" />
              </div>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
