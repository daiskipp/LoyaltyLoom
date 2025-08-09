import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { ArrowLeft, Save, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import Header from "@/components/layout/header";

export default function ProfileEdit() {
  const { user, isLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [nickname, setNickname] = useState("");
  const [userId, setUserId] = useState("");

  // Initialize form with current user data
  useEffect(() => {
    if (user) {
      setNickname(user.nickname || "");
      setUserId(user.userId || "");
    }
  }, [user]);

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

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (profileData: { nickname?: string; userId?: string }) => {
      const res = await apiRequest("PATCH", "/api/auth/user", profileData);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({
        title: "更新完了",
        description: "プロフィールが正常に更新されました。",
      });
      setTimeout(() => {
        window.location.href = "/profile";
      }, 1000);
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
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
      toast({
        title: "更新失敗",
        description: error.message || "プロフィールの更新に失敗しました。",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!nickname.trim()) {
      toast({
        title: "入力エラー",
        description: "ニックネームを入力してください。",
        variant: "destructive",
      });
      return;
    }

    if (!userId.trim()) {
      toast({
        title: "入力エラー",
        description: "ユーザーIDを入力してください。",
        variant: "destructive",
      });
      return;
    }

    // Validate userId format
    if (!/^[a-zA-Z0-9_]+$/.test(userId)) {
      toast({
        title: "入力エラー",
        description: "ユーザーIDは英数字とアンダースコアのみ使用できます。",
        variant: "destructive",
      });
      return;
    }

    if (userId.length < 3 || userId.length > 20) {
      toast({
        title: "入力エラー",
        description: "ユーザーIDは3文字以上20文字以内で入力してください。",
        variant: "destructive",
      });
      return;
    }

    if (nickname.length > 30) {
      toast({
        title: "入力エラー",
        description: "ニックネームは30文字以内で入力してください。",
        variant: "destructive",
      });
      return;
    }

    updateProfileMutation.mutate({
      nickname: nickname.trim(),
      userId: userId.trim(),
    });
  };

  if (isLoading) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gray-50 pt-16 pb-20">
          <div className="max-w-md mx-auto px-6 py-8">
            <div className="text-center text-gray-500">読み込み中...</div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 pt-16 pb-20">
        <div className="max-w-md mx-auto px-6 py-8">
          {/* Header */}
          <div className="flex items-center mb-8">
            <Button
              variant="ghost"
              size="icon"
              className="mr-3"
              onClick={() => window.location.href = "/profile"}
            >
              <ArrowLeft className="w-6 h-6" />
            </Button>
            <h1 className="text-xl font-bold text-gray-900">プロフィール編集</h1>
          </div>

          {/* Profile Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <User className="w-5 h-5 mr-2 text-primary" />
                プロフィール情報
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="nickname" className="text-sm font-medium text-gray-700">
                    ニックネーム
                  </Label>
                  <Input
                    id="nickname"
                    type="text"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    placeholder="例: 山田太郎"
                    className="text-lg min-h-touch"
                    maxLength={30}
                  />
                  <p className="text-xs text-gray-500">
                    30文字以内で入力してください
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="userId" className="text-sm font-medium text-gray-700">
                    ユーザーID
                  </Label>
                  <Input
                    id="userId"
                    type="text"
                    value={userId}
                    onChange={(e) => setUserId(e.target.value)}
                    placeholder="例: yamada_taro"
                    className="text-lg min-h-touch"
                    maxLength={20}
                  />
                  <p className="text-xs text-gray-500">
                    3〜20文字、英数字とアンダースコアのみ使用可能
                  </p>
                </div>

                <div className="pt-4">
                  <Button
                    type="submit"
                    disabled={updateProfileMutation.isPending}
                    className="w-full min-h-touch text-lg font-semibold"
                  >
                    {updateProfileMutation.isPending ? (
                      "更新中..."
                    ) : (
                      <>
                        <Save className="w-5 h-5 mr-2" />
                        更新する
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}