import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";
import { ArrowLeft, Store, QrCode, Heart, HeartOff, MapPin } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
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
  store: {
    id: string;
    name: string;
  };
}

export default function DemoStores() {
  const { user, isLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

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

  // Fetch stores data
  const { data: stores = [], isLoading: storesLoading } = useQuery<Store[]>({
    queryKey: ["/api/stores"],
    enabled: !!user,
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

  // Fetch QR code for a store
  const getQRCode = async (storeId: string) => {
    try {
      const response = await fetch(`/api/stores/${storeId}/qr`, {
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
                <title>QRコード - ${stores.find((s: Store) => s.id === storeId)?.name}</title>
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
                  <h1>${stores.find((s: Store) => s.id === storeId)?.name}</h1>
                  <p>このQRコードをスキャンしてチェックイン</p>
                  <img src="${data.qrCode}" alt="QRコード" />
                  <div class="points">XP+${stores.find((s: Store) => s.id === storeId)?.experiencePerVisit} LP+${stores.find((s: Store) => s.id === storeId)?.loyaltyPerVisit} C+${stores.find((s: Store) => s.id === storeId)?.coinsPerVisit}</div>
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
          <h1 className="text-2xl font-bold text-text">デモストア一覧</h1>
        </div>

        {/* Loading state */}
        {storesLoading && (
          <div className="text-center py-8">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-senior text-gray-600">ストア情報を読み込み中...</p>
          </div>
        )}

        {/* Empty state */}
        {!storesLoading && stores.length === 0 && (
          <Card className="card-senior">
            <CardContent className="text-center py-12">
              <Store className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-senior-lg font-semibold text-text mb-2">
                ストアがありません
              </h3>
              <p className="text-senior text-gray-600 mb-6">
                ホーム画面で「デモストア作成」を<br />
                押してストアを作成してください
              </p>
              <Button
                onClick={() => window.location.href = "/"}
                className="button-senior bg-primary hover:bg-blue-600 text-white"
              >
                ホームに戻る
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Stores list */}
        {!storesLoading && stores.length > 0 && (
          <div className="space-y-4">
            <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-4 mb-6">
              <p className="text-senior text-blue-800 text-center">
                QRコードを表示してスマートフォンでスキャンテストができます
              </p>
            </div>
            
            {stores.map((store) => {
              const isStoreFavorited = isFavorite(store.id);
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
              
              return (
                <Card key={store.id} className={`card-senior transition-all duration-200 ${
                  isStoreFavorited ? 'border-pink-200 bg-pink-50' : 'border-gray-200 bg-white'
                }`}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-senior-lg flex items-center">
                        <Store className={`w-6 h-6 mr-3 ${isStoreFavorited ? 'text-pink-600' : 'text-primary'}`} />
                        <div>
                          <div className="flex items-center space-x-2">
                            {store.name}
                            <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStoreTypeColor(store.storeType)}`}>
                              {store.storeType}
                            </span>
                          </div>
                        </div>
                      </CardTitle>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleFavorite(store.id)}
                        disabled={addFavoriteMutation.isPending || removeFavoriteMutation.isPending}
                        className={`${isStoreFavorited ? 
                          "border-pink-300 text-pink-600 hover:bg-pink-100" : 
                          "border-gray-300 text-gray-600 hover:bg-gray-100"
                        } min-h-[44px] w-[44px]`}
                      >
                        {isStoreFavorited ? (
                          <Heart className="w-4 h-4 fill-current" />
                        ) : (
                          <HeartOff className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {store.address && (
                        <div className="flex items-center text-senior text-gray-600">
                          <MapPin className="w-4 h-4 mr-2" />
                          {store.address}
                        </div>
                      )}
                      
                      <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded-lg">
                        報酬: XP{store.experiencePerVisit} / ポイント{store.loyaltyPerVisit} / コイン{store.coinsPerVisit} / ジェム{store.gemsPerVisit}
                      </div>
                      
                      <Button
                        onClick={() => getQRCode(store.id)}
                        className="w-full button-senior bg-primary hover:bg-blue-600 text-white mt-4"
                      >
                        <QrCode className="w-5 h-5 mr-3" />
                        QRコードを表示
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}