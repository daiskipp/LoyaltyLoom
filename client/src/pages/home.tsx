import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { Crown, Plus, Gift, QrCode, History, User, Coins, Award } from "lucide-react";
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
  experiencePoints: number;
  loyaltyPoints: number;
  coins: number;
  gems: number;
  level: number;
  rank: string;
}

interface Activity {
  id: string;
  type: string;
  storeName: string | null;
  description: string;
  rewards: {
    experience: number;
    loyalty: number;
    coins: number;
    gems: number;
  };
  createdAt: string;
}

interface Announcement {
  id: string;
  title: string;
  content: string;
  type: "info" | "event" | "promotion" | "urgent";
  priority: number;
  storeId?: string;
  startDate: string;
  endDate?: string;
  imageUrl?: string;
  actionUrl?: string;
  createdAt: string;
}

export default function Home() {
  const { user, isLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [lastCheckin, setLastCheckin] = useState<{
    storeName: string;
    rewards: {
      experience: number;
      loyalty: number;
      coins: number;
      gems: number;
    };
    leveledUp?: boolean;
    levelAfter?: number;
  } | null>(null);

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
  });

  // Fetch announcements data
  const { data: announcements = [] } = useQuery<Announcement[]>({
    queryKey: ["/api/announcements"],
    enabled: !!user,
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
        rewards: data.rewards,
        leveledUp: data.leveledUp,
        levelAfter: data.levelAfter,
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

  // Initialize demo stores mutation
  const initDemoMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/init-demo", {});
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "初期化完了",
        description: "デモストアが作成されました。QRスキャンを試してください！",
      });
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
    },
  });

  // Initialize demo announcements mutation
  const initAnnouncementsMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/init-announcements", {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/announcements"] });
      toast({
        title: "お知らせ作成完了",
        description: "デモお知らせが作成されました！",
      });
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

  const experiencePoints = userData.experiencePoints || 0;
  const loyaltyPoints = userData.loyaltyPoints || 0;
  const coins = userData.coins || 0;
  const gems = userData.gems || 0;
  const level = userData.level || 1;
  const rank = userData.rank || 'ブロンズ';
  
  // Calculate experience to next level (100 XP per level)
  const currentLevelXP = (level - 1) * 100;
  const nextLevelXP = level * 100;
  const xpInCurrentLevel = experiencePoints - currentLevelXP;
  const xpNeededForNextLevel = nextLevelXP - experiencePoints;
  const levelProgressPercentage = (xpInCurrentLevel / 100) * 100;
  
  // Calculate loyalty points to next rank
  let loyaltyToNextRank = 0;
  let rankProgressPercentage = 0;
  
  if (loyaltyPoints < 1000) {
    loyaltyToNextRank = 1000 - loyaltyPoints;
    rankProgressPercentage = (loyaltyPoints / 1000) * 100;
  } else if (loyaltyPoints < 5000) {
    loyaltyToNextRank = 5000 - loyaltyPoints;
    rankProgressPercentage = ((loyaltyPoints - 1000) / 4000) * 100;
  } else if (loyaltyPoints < 10000) {
    loyaltyToNextRank = 10000 - loyaltyPoints;
    rankProgressPercentage = ((loyaltyPoints - 5000) / 5000) * 100;
  } else {
    loyaltyToNextRank = 0;
    rankProgressPercentage = 100;
  }

  const handleQRScan = (code: string) => {
    checkinMutation.mutate(code);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="max-w-md mx-auto px-6 pb-24">
        {/* Announcements Section */}
        {announcements.length > 0 && (
          <div className="space-y-4 mb-6 mt-6">
            <h2 className="text-xl font-bold text-gray-900">お知らせ</h2>
            <div className="space-y-3">
              {announcements.map((announcement) => (
                <div
                  key={announcement.id}
                  className={`
                    p-4 rounded-lg border-l-4 bg-white shadow-sm
                    ${announcement.type === "urgent" ? "border-red-500 bg-red-50" : 
                      announcement.type === "promotion" ? "border-blue-500 bg-blue-50" :
                      announcement.type === "event" ? "border-green-500 bg-green-50" :
                      "border-gray-500 bg-gray-50"}
                  `}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 text-lg mb-2">
                        {announcement.title}
                      </h3>
                      <p className="text-gray-700 leading-relaxed mb-2">
                        {announcement.content}
                      </p>
                      <div className="flex items-center text-sm text-gray-500">
                        <span>
                          {new Date(announcement.createdAt).toLocaleDateString('ja-JP', {
                            year: 'numeric',
                            month: 'numeric',
                            day: 'numeric',
                          })}
                        </span>
                        {announcement.endDate && (
                          <span className="ml-4">
                            期限: {new Date(announcement.endDate).toLocaleDateString('ja-JP', {
                              year: 'numeric',
                              month: 'numeric',
                              day: 'numeric',
                            })}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className={`
                      px-3 py-1 rounded-full text-xs font-medium ml-4
                      ${announcement.type === "urgent" ? "bg-red-100 text-red-800" :
                        announcement.type === "promotion" ? "bg-blue-100 text-blue-800" :
                        announcement.type === "event" ? "bg-green-100 text-green-800" :
                        "bg-gray-100 text-gray-800"}
                    `}>
                      {announcement.type === "urgent" ? "緊急" :
                       announcement.type === "promotion" ? "キャンペーン" :
                       announcement.type === "event" ? "イベント" : "お知らせ"}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* RPG-Style Stats Cards */}
        <div className="space-y-4 mb-6 mt-6">
          {/* Membership Card */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
            {/* Card Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xs font-semibold tracking-widest uppercase text-gray-500 mb-1">MEMBER CARD</h3>
                <h2 className="text-lg font-bold text-gray-900">ロイヤルティ会員証</h2>
              </div>
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                <Crown className="w-6 h-6 text-gray-600" />
              </div>
            </div>
            
            {/* Member Info */}
            <div className="mb-6">
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center text-2xl font-bold text-gray-700">
                  {userData.firstName ? userData.firstName.charAt(0).toUpperCase() : 'G'}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{userData.firstName || 'ゲスト'}</h3>
                  <p className="text-sm text-gray-600">{userData.email || 'ゲストユーザー'}</p>
                </div>
              </div>
            </div>
            
            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">{level}</p>
                <p className="text-xs uppercase tracking-wide text-gray-500">レベル</p>
              </div>
              <div className="text-center border-x border-gray-200">
                <p className="text-lg font-bold text-gray-900">{loyaltyPoints.toLocaleString()}</p>
                <p className="text-xs uppercase tracking-wide text-gray-500">ポイント</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-gray-900">{rank}</p>
                <p className="text-xs uppercase tracking-wide text-gray-500">ランク</p>
              </div>
            </div>
            
            {/* Progress Bar */}
            {xpNeededForNextLevel > 0 && (
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs text-gray-600">次のレベルまで</span>
                  <span className="text-xs font-semibold text-gray-900">{xpNeededForNextLevel} XP</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-gray-900 h-2 rounded-full transition-all duration-500" 
                    style={{ width: `${levelProgressPercentage}%` }}
                  ></div>
                </div>
              </div>
            )}
            
            {/* Card Number */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-400 tracking-widest">CARD NO.</p>
              <p className="text-sm font-mono text-gray-600">**** **** **** {userData.id?.slice(-4) || '0000'}</p>
            </div>
          </div>

          {/* Currency Grid */}
          <div className="grid grid-cols-3 gap-3">
            {/* Coins */}
            <div className="bg-white border border-gray-200 rounded-xl p-4 text-center shadow-sm">
              <div className="w-6 h-6 mx-auto mb-2 bg-gray-100 rounded-full flex items-center justify-center">
                <span className="text-xs font-bold text-gray-600">¥</span>
              </div>
              <p className="text-xs text-gray-500 mb-1">コイン</p>
              <p className="text-lg font-bold text-gray-900">{coins.toLocaleString()}</p>
            </div>
            
            {/* Gems */}
            <div className="bg-white border border-gray-200 rounded-xl p-4 text-center shadow-sm">
              <div className="w-6 h-6 mx-auto mb-2 bg-gray-100 rounded-full flex items-center justify-center">
                <span className="text-xs font-bold text-gray-600">💎</span>
              </div>
              <p className="text-xs text-gray-500 mb-1">ジェム</p>
              <p className="text-lg font-bold text-gray-900">{gems.toLocaleString()}</p>
            </div>
            
            {/* Experience */}
            <div className="bg-white border border-gray-200 rounded-xl p-4 text-center shadow-sm">
              <div className="w-6 h-6 mx-auto mb-2 bg-gray-100 rounded-full flex items-center justify-center">
                <span className="text-xs font-bold text-gray-600">EXP</span>
              </div>
              <p className="text-xs text-gray-500 mb-1">経験値</p>
              <p className="text-lg font-bold text-gray-900">{experiencePoints.toLocaleString()}</p>
            </div>
          </div>

          {/* Rank Progress */}
          {loyaltyToNextRank > 0 && (
            <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600">次のランクまで</span>
                <span className="text-sm font-semibold text-gray-900">{loyaltyToNextRank} ロイヤル</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-gray-900 h-2 rounded-full transition-all duration-500" 
                  style={{ width: `${rankProgressPercentage}%` }}
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
            <div className="w-16 h-16 bg-gray-900 rounded-full flex items-center justify-center">
              <QrCode className="text-white w-8 h-8" />
            </div>
            <div className="text-center">
              <p className="text-lg font-semibold">QRスキャン</p>
              <p className="text-sm text-gray-600">店舗チェックイン</p>
            </div>
          </Button>
          
          <Button
            onClick={() => window.location.href = "/coin-transfer"}
            className="bg-white hover:bg-gray-50 border-2 border-gray-100 hover:border-orange-600 text-text rounded-2xl p-6 h-auto flex flex-col items-center space-y-3 transition-colors shadow-sm touch-target"
            variant="outline"
          >
            <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center">
              <Coins className="text-white w-8 h-8" />
            </div>
            <div className="text-center">
              <p className="text-lg font-semibold">コイン送金</p>
              <p className="text-sm text-gray-600">友達に送る</p>
            </div>
          </Button>
        </div>

        {/* Secondary Actions */}
        <div className="grid grid-cols-1 gap-4 mb-8">
          <Button
            onClick={() => window.location.href = "/nft-collection"}
            className="bg-white hover:bg-gray-50 border-2 border-gray-100 hover:border-purple-600 text-text rounded-2xl p-4 h-auto flex items-center justify-between transition-colors shadow-sm touch-target"
            variant="outline"
          >
            <div className="flex items-center">
              <div className="w-12 h-12 bg-gray-600 rounded-full flex items-center justify-center mr-4">
                <Award className="text-white w-6 h-6" />
              </div>
              <div className="text-left">
                <p className="text-lg font-semibold">NFTコレクション</p>
                <p className="text-sm text-gray-600">獲得したNFTを確認</p>
              </div>
            </div>
          </Button>

          <Button
            onClick={() => window.location.href = "/history"}
            className="bg-white hover:bg-gray-50 border-2 border-gray-100 hover:border-primary text-text rounded-2xl p-4 h-auto flex items-center justify-between transition-colors shadow-sm touch-target"
            variant="outline"
          >
            <div className="flex items-center">
              <div className="w-12 h-12 bg-gray-600 rounded-full flex items-center justify-center mr-4">
                <History className="text-white w-6 h-6" />
              </div>
              <div className="text-left">
                <p className="text-lg font-semibold">履歴確認</p>
                <p className="text-sm text-gray-600">訪問・ポイント履歴</p>
              </div>
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
                <p className="text-senior text-gray-600 mb-6">
                  まだアクティビティがありません。<br />
                  QRコードをスキャンして最初のポイントを獲得しましょう！
                </p>
                <div className="space-y-3">
                  <Button
                    onClick={() => initAnnouncementsMutation.mutate()}
                    disabled={initAnnouncementsMutation.isPending}
                    className="w-full button-senior bg-blue-600 hover:bg-blue-700 text-white mb-2"
                  >
                    {initAnnouncementsMutation.isPending ? "作成中..." : "お知らせを作成"}
                  </Button>
                  <Button
                    onClick={() => initDemoMutation.mutate()}
                    disabled={initDemoMutation.isPending}
                    className="w-full button-senior bg-gray-900 hover:bg-gray-800 text-white"
                  >
                    {initDemoMutation.isPending ? (
                      <>
                        <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-3"></div>
                        初期化中...
                      </>
                    ) : (
                      'デモストア作成'
                    )}
                  </Button>
                  <Button
                    onClick={() => window.location.href = "/demo-stores"}
                    variant="outline"
                    className="w-full button-senior border-gray-600 text-gray-600 hover:bg-gray-600 hover:text-white"
                  >
                    デモストア一覧
                  </Button>
                </div>
                <p className="text-sm text-gray-500 mt-4">
                  テスト用のストアを作成してQRスキャンを体験できます
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {activities.slice(0, 3).map((activity) => (
                <Card key={activity.id} className="card-senior">
                  <CardContent className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-gray-600 rounded-full flex items-center justify-center flex-shrink-0">
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
                    <div className="text-right space-y-1">
                      {activity.rewards.experience > 0 && (
                        <p className="text-sm font-bold text-gray-700">
                          +{activity.rewards.experience} XP
                        </p>
                      )}
                      {activity.rewards.loyalty > 0 && (
                        <p className="text-sm font-bold text-gray-700">
                          +{activity.rewards.loyalty} LP
                        </p>
                      )}
                      {activity.rewards.coins > 0 && (
                        <p className="text-sm font-bold text-gray-700">
                          +{activity.rewards.coins} コイン
                        </p>
                      )}
                      {activity.rewards.gems > 0 && (
                        <p className="text-sm font-bold text-gray-700">
                          +{activity.rewards.gems} ジェム
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Rank Benefits */}
        {rank === 'ゴールド' && (
          <div className="bg-gray-50 border-2 border-gray-200 rounded-2xl p-6 mb-8">
            <div className="flex items-center mb-4">
              <Crown className="text-gray-600 w-6 h-6 mr-3" />
              <h3 className="text-xl font-bold text-gray-900">ゴールド特典</h3>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-gray-600 rounded-full mr-3"></div>
                <p className="text-lg text-gray-900">ポイント1.5倍獲得</p>
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-gray-600 rounded-full mr-3"></div>
                <p className="text-lg text-gray-900">誕生日ボーナス500pt</p>
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-gray-600 rounded-full mr-3"></div>
                <p className="text-lg text-gray-900">専用カスタマーサポート</p>
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
          rewards={lastCheckin.rewards}
        />
      )}
    </div>
  );
}
