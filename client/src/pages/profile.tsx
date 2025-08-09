import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";
import { User, LogOut, ArrowLeft, Crown, Star, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/layout/header";
import BottomNav from "@/components/layout/bottom-nav";

export default function Profile() {
  const { user, isLoading } = useAuth();
  const { toast } = useToast();

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!isLoading && !user) {
      toast({
        title: "未認証",
        description: "ログインが必要です。ログイン画面に移動します...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [user, isLoading, toast]);

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-senior text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const currentPoints = user.currentPoints || 0;
  const rank = user.rank || 'ブロンズ';

  const getRankIcon = (rank: string) => {
    switch (rank) {
      case 'プラチナ':
        return <Star className="w-6 h-6 text-purple-500" />;
      case 'ゴールド':
        return <Crown className="w-6 h-6 text-yellow-500" />;
      case 'シルバー':
        return <Star className="w-6 h-6 text-gray-400" />;
      default:
        return <Star className="w-6 h-6 text-amber-600" />;
    }
  };

  const getRankColor = (rank: string) => {
    switch (rank) {
      case 'プラチナ':
        return 'from-purple-100 to-purple-200 border-purple-300';
      case 'ゴールド':
        return 'from-yellow-100 to-yellow-200 border-yellow-300';
      case 'シルバー':
        return 'from-gray-100 to-gray-200 border-gray-300';
      default:
        return 'from-amber-100 to-amber-200 border-amber-300';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="max-w-md mx-auto px-6 pb-24">
        {/* Header with back button */}
        <div className="flex items-center mb-6 mt-6">
          <Button
            onClick={() => window.history.back()}
            variant="ghost"
            className="p-2 h-auto mr-3"
          >
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <h1 className="text-2xl font-bold text-text">プロフィール</h1>
        </div>

        {/* Profile Card */}
        <Card className="card-senior mb-6">
          <CardContent className="text-center">
            <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
              {user.profileImageUrl ? (
                <img 
                  src={user.profileImageUrl} 
                  alt="プロフィール"
                  className="w-24 h-24 rounded-full object-cover"
                />
              ) : (
                <User className="w-12 h-12 text-gray-500" />
              )}
            </div>
            
            <h2 className="text-senior-xl font-bold text-text mb-2">
              {user.firstName || user.lastName 
                ? `${user.firstName || ''} ${user.lastName || ''}`.trim()
                : 'ゲスト'
              }
            </h2>
            
            {user.email && (
              <p className="text-senior text-gray-600 mb-4">{user.email}</p>
            )}
            
            <div className={`inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r ${getRankColor(rank)} border-2 mb-4`}>
              {getRankIcon(rank)}
              <span className="ml-2 font-semibold text-text">{rank}ランク</span>
            </div>
            
            <Button
              onClick={() => window.location.href = "/profile/edit"}
              variant="outline"
              className="button-senior border-primary text-primary hover:bg-primary hover:text-white"
            >
              <Edit className="w-5 h-5 mr-3" />
              プロフィール編集
            </Button>
          </CardContent>
        </Card>

        {/* Points Summary */}
        <Card className="card-senior mb-6">
          <CardHeader>
            <CardTitle className="text-senior-lg">ポイント概要</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <p className="text-3xl font-bold text-primary mb-2">
                {currentPoints.toLocaleString()}
              </p>
              <p className="text-senior text-gray-600">現在のポイント</p>
            </div>
          </CardContent>
        </Card>

        {/* Rank Benefits */}
        <Card className="card-senior mb-6">
          <CardHeader>
            <CardTitle className="text-senior-lg">ランク特典</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {rank === 'プラチナ' && (
                <>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-success rounded-full mr-3"></div>
                    <p className="text-senior text-text">ポイント2倍獲得</p>
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-success rounded-full mr-3"></div>
                    <p className="text-senior text-text">誕生日ボーナス1000pt</p>
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-success rounded-full mr-3"></div>
                    <p className="text-senior text-text">VIPカスタマーサポート</p>
                  </div>
                </>
              )}
              
              {rank === 'ゴールド' && (
                <>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-success rounded-full mr-3"></div>
                    <p className="text-senior text-text">ポイント1.5倍獲得</p>
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-success rounded-full mr-3"></div>
                    <p className="text-senior text-text">誕生日ボーナス500pt</p>
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-success rounded-full mr-3"></div>
                    <p className="text-senior text-text">専用カスタマーサポート</p>
                  </div>
                </>
              )}
              
              {rank === 'シルバー' && (
                <>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-success rounded-full mr-3"></div>
                    <p className="text-senior text-text">ポイント1.2倍獲得</p>
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-success rounded-full mr-3"></div>
                    <p className="text-senior text-text">誕生日ボーナス200pt</p>
                  </div>
                </>
              )}
              
              {rank === 'ブロンズ' && (
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-success rounded-full mr-3"></div>
                  <p className="text-senior text-text">基本ポイント獲得</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Settings */}
        <div className="space-y-4">
          <Button
            onClick={handleLogout}
            variant="outline"
            className="w-full button-senior border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
          >
            <LogOut className="w-5 h-5 mr-3" />
            ログアウト
          </Button>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
