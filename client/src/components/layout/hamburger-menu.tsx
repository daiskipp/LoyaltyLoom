import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/hooks/useAuth";
import { 
  Menu, 
  Home, 
  QrCode, 
  Coins, 
  Award, 
  History, 
  User, 
  LogOut,
  Store
} from "lucide-react";

interface UserData {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
  level?: number;
  rank?: string;
}

export default function HamburgerMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuth() as { user: UserData | null };

  const menuItems = [
    {
      href: "/",
      icon: Home,
      label: "ホーム",
      description: "メインページ"
    },
    {
      href: "/demo-stores", 
      icon: Store,
      label: "店舗一覧",
      description: "参加店舗を確認"
    },
    {
      href: "/coin-transfer",
      icon: Coins,
      label: "コイン送金",
      description: "友達にコインを送る"
    },
    {
      href: "/nft-collection",
      icon: Award,
      label: "NFTコレクション",
      description: "獲得したNFTを確認"
    },
    {
      href: "/history",
      icon: History,
      label: "履歴",
      description: "訪問・ポイント履歴"
    },
    {
      href: "/profile",
      icon: User,
      label: "プロフィール",
      description: "個人情報・設定"
    }
  ];

  const handleItemClick = () => {
    setIsOpen(false);
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="text-white hover:bg-white/10"
        >
          <Menu className="h-6 w-6" />
        </Button>
      </SheetTrigger>
      
      <SheetContent side="left" className="w-80 p-0">
        <SheetHeader className="bg-primary p-6 text-white">
          <div className="flex items-center space-x-3">
            {user?.profileImageUrl ? (
              <img
                src={user.profileImageUrl}
                alt="プロフィール"
                className="w-12 h-12 rounded-full object-cover"
              />
            ) : (
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <User className="w-6 h-6" />
              </div>
            )}
            <div>
              <SheetTitle className="text-white text-left">
                {(user as any)?.nickname || "ユーザー"}
              </SheetTitle>
              <p className="text-sm text-white/80 text-left">
                {(user as any)?.userId && `@${(user as any).userId} • `}レベル {(user as any)?.level || 1} • {(user as any)?.rank || "ブロンズ"}
              </p>
            </div>
          </div>
        </SheetHeader>

        <div className="flex flex-col h-full">
          <nav className="flex-1 p-4">
            <div className="space-y-2">
              {menuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link key={item.href} href={item.href}>
                    <Button
                      variant="ghost"
                      className="w-full justify-start h-auto p-4 text-left hover:bg-gray-50"
                      onClick={handleItemClick}
                    >
                      <div className="flex items-center space-x-4 w-full">
                        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                          <Icon className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{item.label}</p>
                          <p className="text-sm text-gray-500">{item.description}</p>
                        </div>
                      </div>
                    </Button>
                  </Link>
                );
              })}
            </div>
          </nav>

          <div className="border-t p-4">
            <Button
              variant="ghost"
              className="w-full justify-start h-auto p-4 text-left hover:bg-red-50 text-red-600"
              onClick={() => {
                window.location.href = "/api/logout";
              }}
            >
              <div className="flex items-center space-x-4 w-full">
                <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
                  <LogOut className="w-5 h-5 text-red-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">ログアウト</p>
                  <p className="text-sm text-gray-500">アカウントからサインアウト</p>
                </div>
              </div>
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}