import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { useRoute } from "wouter";
import { ArrowLeft, Store, QrCode, Heart, HeartOff, MapPin, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import Header from "@/components/layout/header";
import BottomNav from "@/components/layout/bottom-nav";

interface Store {
  id: string;
  name: string;
  address: string;
  storeType: string;
  experiencePerVisit: number;
  loyaltyPerVisit: number;
  coinsPerVisit: number;
  gemsPerVisit: number;
}

interface FavoriteStore {
  id: string;
  userId: string;
  storeId: string;
  createdAt: string;
}

export default function StoreDetail() {
  const { user, isLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, params] = useRoute("/store/:id");
  const storeId = params?.id;

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

  // Fetch store data
  const { data: store, isLoading: storeLoading } = useQuery<Store>({
    queryKey: ["/api/stores", storeId],
    enabled: !!user && !!storeId,
  });

  // Fetch user's favorite stores
  const { data: favoriteStores = [] } = useQuery<FavoriteStore[]>({
    queryKey: ["/api/favorite-stores"],
    enabled: !!user,
  });

  // Add to favorites mutation
  const addFavoriteMutation = useMutation({
    mutationFn: async (storeId: string) => {
      const response = await apiRequest("POST", "/api/favorite-stores", { storeId });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/favorite-stores"] });
      queryClient.invalidateQueries({ queryKey: ["/api/announcements/filtered"] });
      toast({
        title: "お気に入り追加",
        description: "店舗をお気に入りに追加しました",
      });
    },
    onError: (error) => {
      toast({
        title: "エラー",
        description: "お気に入りの追加に失敗しました",
        variant: "destructive",
      });
    },
  });

  // Remove from favorites mutation
  const removeFavoriteMutation = useMutation({
    mutationFn: async (storeId: string) => {
      const response = await apiRequest("DELETE", `/api/favorite-stores/${storeId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/favorite-stores"] });
      queryClient.invalidateQueries({ queryKey: ["/api/announcements/filtered"] });
      toast({
        title: "お気に入り削除",
        description: "店舗をお気に入りから削除しました",
      });
    },
    onError: (error) => {
      toast({
        title: "エラー",
        description: "お気に入りの削除に失敗しました",
        variant: "destructive",
      });
    },
  });

  const isFavorite = (storeId: string) => {
    return favoriteStores.some(fs => fs.storeId === storeId);
  };

  const toggleFavorite = (storeId: string) => {
    if (isFavorite(storeId)) {
      removeFavoriteMutation.mutate(storeId);
    } else {
      addFavoriteMutation.mutate(storeId);
    }
  };

  // Fetch QR code for the store
  const getQRCode = async () => {
    if (!store) return;
    
    try {
      const response = await fetch(`/api/stores/${store.id}/qr`, {
        credentials: 'include'
      });
      const data = await response.json();
      
      if (data.qrCode) {
        // Create a new window to display the QR code
        const qrWindow = window.open('', '_blank', 'width=400,height=500');
        if (qrWindow) {
          qrWindow.document.write(`
            <html>
              <head>
                <title>QRコード - ${store.name}</title>
                <style>
                  body { 
                    font-family: 'Noto Sans JP', sans-serif; 
                    text-align: center; 
                    padding: 20px; 
                    margin: 0;
                    background: #f5f5f5;
                  }
                  .container {
                    background: white;
                    padding: 30px;
                    border-radius: 16px;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                    max-width: 350px;
                    margin: 0 auto;
                  }
                  h1 { 
                    color: #333; 
                    font-size: 24px; 
                    margin-bottom: 10px;
                  }
                  p { 
                    color: #666; 
                    font-size: 16px; 
                    margin-bottom: 20px; 
                  }
                  img { 
                    max-width: 250px; 
                    height: auto; 
                    border: 2px solid #e5e5e5;
                    border-radius: 8px;
                  }
                  .points {
                    background: #4A90E2;
                    color: white;
                    padding: 8px 16px;
                    border-radius: 20px;
                    font-weight: bold;
                    display: inline-block;
                    margin-top: 15px;
                  }
                </style>
              </head>
              <body>
                <div class="container">
                  <h1>${store.name}</h1>
                  <p>このQRコードをスキャンしてチェックイン</p>
                  <img src="${data.qrCode}" alt="QRコード" />
                  <div class="points">XP+${store.experiencePerVisit} LP+${store.loyaltyPerVisit} C+${store.coinsPerVisit}</div>
                </div>
              </body>
            </html>
          `);
          qrWindow.document.close();
        }
      }
    } catch (error) {
      toast({
        title: "エラー",
        description: "QRコードの取得に失敗しました。",
        variant: "destructive",
      });
    }
  };

  const getStoreTypeColor = (storeType: string) => {
    switch (storeType) {
      case "カフェ":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "レストラン":
        return "bg-red-100 text-red-800 border-red-200";
      case "小売店":
        return "bg-blue-100 text-blue-800 border-blue-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (!store && !storeLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="container mx-auto px-4 pt-20 pb-20 max-w-2xl">
          <div className="text-center py-12">
            <Store className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">店舗が見つかりません</h1>
            <p className="text-gray-600 mb-6">指定された店舗は存在しないか、削除されている可能性があります。</p>
            <Button
              onClick={() => window.history.back()}
              className="bg-primary hover:bg-blue-600 text-white"
            >
              戻る
            </Button>
          </div>
        </main>
        <BottomNav />
      </div>
    );
  }

  if (!store) return null;

  const isStoreFavorited = isFavorite(store.id);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="container mx-auto px-4 pt-20 pb-20 max-w-2xl">
        {/* Header with back button */}
        <div className="flex items-center mb-6">
          <Button
            onClick={() => window.history.back()}
            variant="ghost"
            className="p-2 h-auto mr-3"
          >
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">店舗詳細</h1>
        </div>

        {/* Store Information Card */}
        <Card className={`mb-6 transition-all duration-200 ${
          isStoreFavorited ? 'border-pink-200 bg-pink-50' : 'border-gray-200 bg-white'
        }`}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-2xl font-bold text-gray-900 mb-2">
                  {store.name}
                </CardTitle>
                <div className="flex items-center space-x-2 mb-3">
                  <span className={`px-3 py-1 text-sm font-medium rounded-full border ${getStoreTypeColor(store.storeType)}`}>
                    {store.storeType}
                  </span>
                  {isStoreFavorited && (
                    <span className="px-3 py-1 text-sm font-medium rounded-full bg-pink-100 text-pink-800 border border-pink-200">
                      お気に入り
                    </span>
                  )}
                </div>
              </div>
              <Button
                variant="outline"
                size="lg"
                onClick={() => toggleFavorite(store.id)}
                disabled={addFavoriteMutation.isPending || removeFavoriteMutation.isPending}
                className={`${isStoreFavorited ? 
                  "border-pink-300 text-pink-600 hover:bg-pink-100" : 
                  "border-gray-300 text-gray-600 hover:bg-gray-100"
                } min-h-[44px] min-w-[44px]`}
              >
                {isStoreFavorited ? (
                  <Heart className="w-5 h-5 fill-current" />
                ) : (
                  <HeartOff className="w-5 h-5" />
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Address */}
              <div className="flex items-start space-x-3">
                <MapPin className="w-5 h-5 text-gray-500 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900">住所</p>
                  <p className="text-gray-600">{store.address}</p>
                </div>
              </div>

              {/* Rewards Section */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-3">
                  <Award className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold text-gray-900">チェックイン報酬</h3>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white rounded-lg p-3 text-center">
                    <p className="text-sm text-gray-600">経験値</p>
                    <p className="text-xl font-bold text-blue-600">+{store.experiencePerVisit}</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 text-center">
                    <p className="text-sm text-gray-600">ロイヤルティ</p>
                    <p className="text-xl font-bold text-green-600">+{store.loyaltyPerVisit}</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 text-center">
                    <p className="text-sm text-gray-600">コイン</p>
                    <p className="text-xl font-bold text-yellow-600">+{store.coinsPerVisit}</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 text-center">
                    <p className="text-sm text-gray-600">ジェム</p>
                    <p className="text-xl font-bold text-purple-600">+{store.gemsPerVisit}</p>
                  </div>
                </div>
              </div>

              {/* QR Code Button */}
              <Button
                onClick={getQRCode}
                className="w-full bg-primary hover:bg-blue-600 text-white py-4 text-lg"
                size="lg"
              >
                <QrCode className="w-6 h-6 mr-3" />
                QRコードを表示してチェックイン
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>

      <BottomNav />
    </div>
  );
}