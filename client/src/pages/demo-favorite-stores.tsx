import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";
import { Heart, HeartOff, Store, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
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
  store: {
    id: string;
    name: string;
  };
}

export default function DemoFavoriteStores() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all stores
  const { data: stores = [] } = useQuery<Store[]>({
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

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="container mx-auto px-4 pt-20 pb-20 max-w-2xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            お気に入り店舗
          </h1>
          <p className="text-gray-600">
            店舗をお気に入りに追加すると、その店舗からのお知らせが表示されるようになります
          </p>
        </div>

        {/* Favorite Stores Section */}
        {favoriteStores.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              お気に入りの店舗 ({favoriteStores.length})
            </h2>
            <div className="space-y-3">
              {favoriteStores.map((favoriteStore) => {
                const store = stores.find(s => s.id === favoriteStore.storeId);
                if (!store) return null;
                
                return (
                  <Card key={favoriteStore.id} className="border border-pink-200 bg-pink-50">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-pink-100 rounded-lg">
                            <Heart className="w-5 h-5 text-pink-600 fill-current" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">{store.name}</h3>
                            <div className="flex items-center text-sm text-gray-500 mt-1">
                              <MapPin className="w-4 h-4 mr-1" />
                              {store.address}
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleFavorite(store.id)}
                          disabled={removeFavoriteMutation.isPending}
                          className="border-pink-300 text-pink-600 hover:bg-pink-100"
                        >
                          <Heart className="w-4 h-4 fill-current" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* All Stores Section */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            すべての店舗
          </h2>
          <div className="space-y-3">
            {stores.map((store) => {
              const isStoreFavorited = isFavorite(store.id);
              
              return (
                <Card key={store.id} className={`transition-all duration-200 ${
                  isStoreFavorited ? 'border-pink-200 bg-pink-50' : 'border-gray-200 bg-white hover:bg-gray-50'
                }`}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-lg ${
                          isStoreFavorited ? 'bg-pink-100' : 'bg-gray-100'
                        }`}>
                          <Store className={`w-5 h-5 ${
                            isStoreFavorited ? 'text-pink-600' : 'text-gray-600'
                          }`} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <h3 className="font-semibold text-gray-900">{store.name}</h3>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStoreTypeColor(store.storeType)}`}>
                              {store.storeType}
                            </span>
                          </div>
                          <div className="flex items-center text-sm text-gray-500 mb-2">
                            <MapPin className="w-4 h-4 mr-1" />
                            {store.address}
                          </div>
                          <div className="text-xs text-gray-600">
                            報酬: XP{store.experiencePerVisit} / ポイント{store.loyaltyPerVisit} / コイン{store.coinsPerVisit}
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleFavorite(store.id)}
                        disabled={addFavoriteMutation.isPending || removeFavoriteMutation.isPending}
                        className={isStoreFavorited ? 
                          "border-pink-300 text-pink-600 hover:bg-pink-100" : 
                          "border-gray-300 text-gray-600 hover:bg-gray-100"
                        }
                      >
                        {isStoreFavorited ? (
                          <Heart className="w-4 h-4 fill-current" />
                        ) : (
                          <HeartOff className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {stores.length === 0 && (
          <div className="text-center py-8">
            <Store className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">店舗が見つかりません</p>
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}