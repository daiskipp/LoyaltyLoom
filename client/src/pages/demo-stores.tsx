import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";
import { ArrowLeft, Store, Heart, HeartOff, MapPin, ChevronRight } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { Link } from "wouter";
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
                店舗をタップして詳細を確認・チェックインができます
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
                <Link key={store.id} href={`/store/${store.id}`}>
                  <Card className={`card-senior transition-all duration-200 cursor-pointer hover:shadow-md ${
                    isStoreFavorited ? 'border-pink-200 bg-pink-50' : 'border-gray-200 bg-white'
                  }`}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-senior-lg flex items-center flex-1">
                          <Store className={`w-6 h-6 mr-3 ${isStoreFavorited ? 'text-pink-600' : 'text-primary'}`} />
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              {store.name}
                              <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStoreTypeColor(store.storeType)}`}>
                                {store.storeType}
                              </span>
                            </div>
                          </div>
                        </CardTitle>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              toggleFavorite(store.id);
                            }}
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
                          <ChevronRight className="w-5 h-5 text-gray-400" />
                        </div>
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
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}