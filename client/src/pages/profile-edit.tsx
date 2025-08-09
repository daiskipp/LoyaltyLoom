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
  
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  // Initialize form with current user data
  useEffect(() => {
    if (user) {
      setFirstName(user.firstName || "");
      setLastName(user.lastName || "");
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
    mutationFn: async (profileData: { firstName?: string; lastName?: string }) => {
      const res = await apiRequest("PATCH", "/api/auth/user", profileData);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({
        title: "更新完了",
        description: "プロフィールが正常に更新されました。",
        variant: "default",
      });
      // Navigate back to profile page
      window.history.back();
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
        title: "更新エラー",
        description: "プロフィールの更新に失敗しました。もう一度お試しください。",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const profileData: { firstName?: string; lastName?: string } = {};
    
    if (firstName.trim()) profileData.firstName = firstName.trim();
    if (lastName.trim()) profileData.lastName = lastName.trim();
    
    updateProfileMutation.mutate(profileData);
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
          <h1 className="text-2xl font-bold text-text">プロフィール編集</h1>
        </div>

        {/* Profile Edit Form */}
        <Card className="card-senior mb-6">
          <CardHeader>
            <CardTitle className="text-senior-lg flex items-center">
              <User className="w-6 h-6 mr-3" />
              基本情報
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="firstName" className="text-senior font-medium text-text">
                  名前（名）
                </Label>
                <Input
                  id="firstName"
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="例: 太郎"
                  className="text-senior min-h-touch border-2 border-gray-200 focus:border-primary rounded-lg"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName" className="text-senior font-medium text-text">
                  名前（姓）
                </Label>
                <Input
                  id="lastName"
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="例: 田中"
                  className="text-senior min-h-touch border-2 border-gray-200 focus:border-primary rounded-lg"
                />
              </div>

              <div className="pt-4">
                <Button
                  type="submit"
                  disabled={updateProfileMutation.isPending}
                  className="w-full button-senior bg-primary hover:bg-blue-600 text-white"
                >
                  {updateProfileMutation.isPending ? (
                    <>
                      <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-3"></div>
                      更新中...
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5 mr-3" />
                      保存する
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Current Email (Read-only) */}
        <Card className="card-senior mb-6">
          <CardHeader>
            <CardTitle className="text-senior-lg">アカウント情報</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label className="text-senior font-medium text-text">
                メールアドレス
              </Label>
              <div className="p-3 bg-gray-50 rounded-lg border-2 border-gray-100">
                <p className="text-senior text-gray-600">
                  {user.email || "未設定"}
                </p>
              </div>
              <p className="text-sm text-gray-500">
                メールアドレスの変更はサポートまでお問い合わせください
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Helper Info */}
        <Card className="card-senior bg-blue-50 border-blue-200">
          <CardContent>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-primary rounded-full mt-3 flex-shrink-0"></div>
              <div>
                <p className="text-senior text-blue-800 font-medium mb-1">
                  プロフィール情報について
                </p>
                <p className="text-base text-blue-700">
                  名前情報は他のユーザーには表示されません。アプリ内での表示とサポート対応にのみ使用されます。
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}