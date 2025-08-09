import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Award, Star, Crown, Zap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Header from "@/components/layout/header";
import BottomNav from "@/components/layout/bottom-nav";
import { Link } from "wouter";
import { formatDistanceToNow } from "date-fns";
import { ja } from "date-fns/locale";

interface UserNft {
  id: string;
  userId: string;
  nftId: string;
  obtainedAt: string;
  obtainedReason: string | null;
  metadata: string | null;
  nft: {
    id: string;
    name: string;
    description: string | null;
    imageUrl: string | null;
    category: string;
    rarity: string;
    isActive: boolean;
    createdAt: string;
  };
}

const getRarityColor = (rarity: string) => {
  switch (rarity) {
    case "legendary":
      return "bg-gradient-to-r from-yellow-400 to-orange-500 text-white";
    case "epic":
      return "bg-gradient-to-r from-purple-500 to-pink-500 text-white";
    case "rare":
      return "bg-gradient-to-r from-blue-500 to-cyan-500 text-white";
    default:
      return "bg-gray-200 text-gray-800";
  }
};

const getRarityIcon = (rarity: string) => {
  switch (rarity) {
    case "legendary":
      return <Crown className="w-4 h-4" />;
    case "epic":
      return <Zap className="w-4 h-4" />;
    case "rare":
      return <Star className="w-4 h-4" />;
    default:
      return <Award className="w-4 h-4" />;
  }
};

const getCategoryLabel = (category: string) => {
  switch (category) {
    case "levelup":
      return "レベルアップ";
    case "achievement":
      return "実績";
    case "event":
      return "イベント";
    case "special":
      return "特別";
    default:
      return category;
  }
};

const getRarityLabel = (rarity: string) => {
  switch (rarity) {
    case "legendary":
      return "レジェンダリー";
    case "epic":
      return "エピック";
    case "rare":
      return "レア";
    case "common":
      return "コモン";
    default:
      return rarity;
  }
};

export default function NftCollection() {
  // Fetch user's NFTs
  const { data: userNfts = [], isLoading } = useQuery<UserNft[]>({
    queryKey: ["/api/nfts/my"],
  });

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container max-w-md mx-auto px-4 py-6 pb-20">
        <div className="flex items-center mb-6">
          <Link href="/">
            <Button variant="ghost" size="icon" className="mr-3">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-text">NFTコレクション</h1>
        </div>

        {/* Stats */}
        <Card className="card-senior mb-6">
          <CardContent className="text-center py-6">
            <div className="flex items-center justify-center mb-3">
              <Award className="w-8 h-8 text-primary mr-3" />
              <h2 className="text-3xl font-bold text-text">{userNfts.length}</h2>
            </div>
            <p className="text-lg text-gray-600">保有NFT</p>
          </CardContent>
        </Card>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="card-senior animate-pulse">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-gray-200 rounded-lg"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded"></div>
                      <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : userNfts.length === 0 ? (
          <Card className="card-senior">
            <CardContent className="text-center py-12">
              <Award className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-text mb-2">
                NFTがありません
              </h3>
              <p className="text-gray-600 mb-6">
                店舗チェックインやレベルアップでNFTを獲得しましょう！
              </p>
              <Link href="/demo-stores">
                <Button className="button-senior bg-primary hover:bg-blue-600 text-white">
                  店舗を探す
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {userNfts.map((userNft) => (
              <Card key={userNft.id} className="card-senior overflow-hidden">
                <CardContent className="p-0">
                  <div className="flex">
                    {/* NFT Image */}
                    <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                      {userNft.nft.imageUrl ? (
                        <img
                          src={userNft.nft.imageUrl}
                          alt={userNft.nft.name}
                          className="w-16 h-16 object-contain"
                        />
                      ) : (
                        <Award className="w-12 h-12 text-primary" />
                      )}
                    </div>

                    {/* NFT Details */}
                    <div className="flex-1 p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="text-lg font-semibold text-text leading-tight">
                          {userNft.nft.name}
                        </h3>
                        <Badge
                          className={`ml-2 ${getRarityColor(userNft.nft.rarity)} flex items-center space-x-1`}
                        >
                          {getRarityIcon(userNft.nft.rarity)}
                          <span className="text-xs">
                            {getRarityLabel(userNft.nft.rarity)}
                          </span>
                        </Badge>
                      </div>

                      {userNft.nft.description && (
                        <p className="text-sm text-gray-600 mb-3 leading-relaxed">
                          {userNft.nft.description}
                        </p>
                      )}

                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <Badge variant="outline" className="text-xs">
                          {getCategoryLabel(userNft.nft.category)}
                        </Badge>
                        <span>
                          {formatDistanceToNow(new Date(userNft.obtainedAt), {
                            addSuffix: true,
                            locale: ja,
                          })}
                        </span>
                      </div>

                      {userNft.obtainedReason && (
                        <div className="mt-2 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                          獲得理由: {userNft.obtainedReason}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}