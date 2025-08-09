import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { Crown, Plus, Gift, QrCode, History, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import Header from "@/components/layout/header";
import BottomNav from "@/components/layout/bottom-nav";
import QRScanner from "@/components/qr-scanner";
import SuccessToast from "@/components/ui/toast-success";

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  profileImageUrl: string;
  currentPoints: number;
  rank: string;
}

interface Activity {
  id: string;
  type: string;
  storeName: string;
  description: string;
  points: number;
  createdAt: string;
}

export default function Home() {
  const { user, isLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [lastCheckin, setLastCheckin] = useState<{ storeName: string; points: number } | null>(null);

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

  // Fetch user data
  const { data: userData } = useQuery<User>({
    queryKey: ["/api/auth/user"],
    enabled: !!user,
  });

  // Fetch activity data
  const { data: activities = [] } = useQuery<Activity[]>({
    queryKey: ["/api/activity"],
    enabled: !!user,
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "未認証",
          description: "ログアウトされました。再度ログインします...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
    },
  });

  // Check-in mutation
  const checkinMutation = useMutation({
    mutationFn: async (qrCode: string) => {
      const res = await apiRequest("POST", "/api/checkin", { qrCode });
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/activity"] });
      
      setLastCheckin({
        storeName: data.storeName,
        points: data.pointsEarned,
      });
      setShowSuccessToast(true);
      setShowQRScanner(false);
      
      setTimeout(() => {
        setShowSuccessToast(false);
      }, 3000);
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "未認証",
          description: "ログアウトされました。再度ログインします...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      
      toast({
        title: "チェックインエラー",
        description: "チェックインに失敗しました。もう一度お試しください。",
        variant: "destructive",
      });
    },
  });

  if (isLoading || !userData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-senior text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  const currentPoints = userData.currentPoints || 0;
  const rank = userData.rank || 'ブロンズ';
  
  // Calculate points to next rank
  let pointsToNextRank = 0;
  let progressPercentage = 0;
  
  if (currentPoints < 500) {
    pointsToNextRank = 500 - currentPoints;
    progressPercentage = (currentPoints / 500) * 100;
  } else if (currentPoints < 2000) {
    pointsToNextRank = 2000 - currentPoints;
    progressPercentage = ((currentPoints - 500) / 1500) * 100;
  } else if (currentPoints < 5000) {
    pointsToNextRank = 5000 - currentPoints;
    progressPercentage = ((currentPoints - 2000) / 3000) * 100;
  } else {
    pointsToNextRank = 0;
    progressPercentage = 100;
  }

  const handleQRScan = (code: string) => {
    checkinMutation.mutate(code);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="max-w-md mx-auto px-6 pb-24">
        {/* Points Card */}
        <div className="bg-gradient-to-br from-primary to-blue-600 rounded-2xl p-8 mb-6 mt-6 shadow-lg text-white">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-xl opacity-90 mb-2">現在のポイント</p>
              <p className="text-4xl font-bold">{currentPoints.toLocaleString()}</p>
              <p className="text-base opacity-90 mt-1">ポイント</p>
            </div>
            <div className="text-right">
              <div className="w-20 h-20 bg-white bg-opacity-20 rounded-full flex items-center justify-center mb-2">
                <Crown className="text-3xl text-yellow-300 w-8 h-8" />
              </div>
              <p className="text-lg font-semibold">{rank}</p>
            </div>
          </div>
          
          {pointsToNextRank > 0 && (
            <div className="bg-white bg-opacity-20 rounded-xl p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-base">次のランクまで</span>
                <span className="text-lg font-semibold">{pointsToNextRank}pt</span>
              </div>
              <div className="w-full bg-white bg-opacity-30 rounded-full h-3">
                <div 
                  className="bg-accent h-3 rounded-full transition-all duration-500" 
                  style={{ width: `${progressPercentage}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <Button
            onClick={() => setShowQRScanner(true)}
            className="bg-white hover:bg-gray-50 border-2 border-gray-100 hover:border-primary text-text rounded-2xl p-6 h-auto flex flex-col items-center space-y-3 transition-colors shadow-sm touch-target"
            variant="outline"
          >
            <div className="w-16 h-16 bg-success rounded-full flex items-center justify-center">
              <QrCode className="text-white w-8 h-8" />
            </div>
            <div className="text-center">
              <p className="text-lg font-semibold">QRスキャン</p>
              <p className="text-sm text-gray-600">店舗チェックイン</p>
            </div>
          </Button>
          
          <Button
            onClick={() => window.location.href = "/history"}
            className="bg-white hover:bg-gray-50 border-2 border-gray-100 hover:border-primary text-text rounded-2xl p-6 h-auto flex flex-col items-center space-y-3 transition-colors shadow-sm touch-target"
            variant="outline"
          >
            <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center">
              <History className="text-white w-8 h-8" />
            </div>
            <div className="text-center">
              <p className="text-lg font-semibold">履歴確認</p>
              <p className="text-sm text-gray-600">訪問・ポイント</p>
            </div>
          </Button>
        </div>

        {/* Recent Activity */}
        <div className="mb-8">
          <h3 className="text-xl font-bold text-text mb-4">最近のアクティビティ</h3>
          
          {activities.length === 0 ? (
            <Card className="card-senior">
              <CardContent className="text-center py-8">
                <Gift className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-senior text-gray-600">
                  まだアクティビティがありません。<br />
                  QRコードをスキャンして最初のポイントを獲得しましょう！
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {activities.slice(0, 3).map((activity) => (
                <Card key={activity.id} className="card-senior">
                  <CardContent className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-success rounded-full flex items-center justify-center flex-shrink-0">
                        <Plus className="text-white w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <p className="text-lg font-semibold text-text mb-1">
                          {activity.storeName || '特典'}
                        </p>
                        <p className="text-base text-gray-600 mb-2">
                          {activity.description}
                        </p>
                        <p className="text-sm text-gray-500">
                          {new Date(activity.createdAt).toLocaleDateString('ja-JP', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-success">
                        +{activity.points}pt
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Rank Benefits */}
        {rank === 'ゴールド' && (
          <div className="bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-200 rounded-2xl p-6 mb-8">
            <div className="flex items-center mb-4">
              <Crown className="text-accent w-6 h-6 mr-3" />
              <h3 className="text-xl font-bold text-text">ゴールド特典</h3>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-success rounded-full mr-3"></div>
                <p className="text-lg text-text">ポイント1.5倍獲得</p>
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-success rounded-full mr-3"></div>
                <p className="text-lg text-text">誕生日ボーナス500pt</p>
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-success rounded-full mr-3"></div>
                <p className="text-lg text-text">専用カスタマーサポート</p>
              </div>
            </div>
          </div>
        )}
      </main>

      <BottomNav />
      
      {showQRScanner && (
        <QRScanner
          onScan={handleQRScan}
          onClose={() => setShowQRScanner(false)}
          isLoading={checkinMutation.isPending}
        />
      )}
      
      {showSuccessToast && lastCheckin && (
        <SuccessToast 
          storeName={lastCheckin.storeName}
          points={lastCheckin.points}
        />
      )}
    </div>
  );
}
