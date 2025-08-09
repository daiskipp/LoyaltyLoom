import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";
import { Plus, Gift, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import Header from "@/components/layout/header";
import BottomNav from "@/components/layout/bottom-nav";

interface Activity {
  id: string;
  type: string;
  storeName: string;
  description: string;
  points: number;
  createdAt: string;
}

export default function History() {
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

  // Fetch activity data
  const { data: activities = [], isLoading: activitiesLoading } = useQuery<Activity[]>({
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
          <h1 className="text-2xl font-bold text-text">アクティビティ履歴</h1>
        </div>

        {/* Loading state */}
        {activitiesLoading && (
          <div className="text-center py-8">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-senior text-gray-600">履歴を読み込み中...</p>
          </div>
        )}

        {/* Empty state */}
        {!activitiesLoading && activities.length === 0 && (
          <Card className="card-senior">
            <CardContent className="text-center py-12">
              <Gift className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-senior-lg font-semibold text-text mb-2">
                履歴がありません
              </h3>
              <p className="text-senior text-gray-600 mb-6">
                QRコードをスキャンして<br />
                最初のポイントを獲得しましょう！
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

        {/* Activity list */}
        {!activitiesLoading && activities.length > 0 && (
          <div className="space-y-4">
            {activities.map((activity) => (
              <Card key={activity.id} className="card-senior">
                <CardContent className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-success rounded-full flex items-center justify-center flex-shrink-0">
                      {activity.type === 'checkin' ? (
                        <Plus className="text-white w-5 h-5" />
                      ) : (
                        <Gift className="text-white w-5 h-5" />
                      )}
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
                    <p className={`text-lg font-bold ${
                      activity.points > 0 ? 'text-success' : 'text-red-500'
                    }`}>
                      {activity.points > 0 ? '+' : ''}{activity.points}pt
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}

            {activities.length >= 20 && (
              <Card className="card-senior">
                <CardContent className="text-center py-6">
                  <p className="text-senior text-gray-600">
                    最新の20件を表示しています
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
