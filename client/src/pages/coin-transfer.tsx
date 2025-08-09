import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Coins, Send, History, ArrowLeft, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import Header from "@/components/layout/header";
import BottomNav from "@/components/layout/bottom-nav";
import { Link } from "wouter";

interface CoinTransaction {
  id: string;
  fromUserId: string | null;
  toUserId: string;
  amount: number;
  message: string | null;
  type: string;
  status: string;
  createdAt: string;
}

export default function CoinTransfer() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"send" | "history">("send");
  const [toUserId, setToUserId] = useState("");
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");

  // Fetch coin balance
  const { data: balance = 0 } = useQuery<{ balance: number }>({
    queryKey: ["/api/coins/balance"],
    select: (data) => data.balance,
  });

  // Fetch coin transactions
  const { data: transactions = [] } = useQuery<CoinTransaction[]>({
    queryKey: ["/api/coins/transactions"],
    enabled: activeTab === "history",
  });

  const transferMutation = useMutation({
    mutationFn: async (data: { toUserId: string; amount: number; message?: string }) => {
      return await apiRequest("/api/coins/transfer", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: (data) => {
      toast({
        title: "送信完了",
        description: data.message,
        variant: "default",
      });
      setToUserId("");
      setAmount("");
      setMessage("");
      queryClient.invalidateQueries({ queryKey: ["/api/coins/balance"] });
      queryClient.invalidateQueries({ queryKey: ["/api/coins/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
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
        title: "送信エラー",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseInt(amount);
    
    if (!toUserId.trim()) {
      toast({
        title: "エラー",
        description: "送信先ユーザーIDを入力してください",
        variant: "destructive",
      });
      return;
    }
    
    if (amountNum <= 0 || isNaN(amountNum)) {
      toast({
        title: "エラー",
        description: "有効な金額を入力してください",
        variant: "destructive",
      });
      return;
    }
    
    if (amountNum > balance) {
      toast({
        title: "エラー",
        description: "コインが不足しています",
        variant: "destructive",
      });
      return;
    }

    transferMutation.mutate({
      toUserId: toUserId.trim(),
      amount: amountNum,
      message: message.trim() || undefined,
    });
  };

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
          <h1 className="text-2xl font-bold text-text">コイン送金</h1>
        </div>

        {/* Balance Display */}
        <Card className="card-senior mb-6">
          <CardContent className="text-center py-8">
            <div className="flex items-center justify-center mb-3">
              <Coins className="w-8 h-8 text-orange-600 mr-3" />
              <h2 className="text-3xl font-bold text-text">{balance}</h2>
            </div>
            <p className="text-lg text-gray-600">コイン残高</p>
          </CardContent>
        </Card>

        {/* Tab Navigation */}
        <div className="flex mb-6">
          <Button
            variant={activeTab === "send" ? "default" : "outline"}
            onClick={() => setActiveTab("send")}
            className="flex-1 mr-2 button-senior"
          >
            <Send className="w-5 h-5 mr-2" />
            送金
          </Button>
          <Button
            variant={activeTab === "history" ? "default" : "outline"}
            onClick={() => setActiveTab("history")}
            className="flex-1 ml-2 button-senior"
          >
            <History className="w-5 h-5 mr-2" />
            履歴
          </Button>
        </div>

        {activeTab === "send" ? (
          <Card className="card-senior">
            <CardHeader>
              <CardTitle className="text-xl text-text">コイン送金</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-3">
                  <Label htmlFor="toUserId" className="text-lg text-text">
                    送信先ユーザーID
                  </Label>
                  <Input
                    id="toUserId"
                    type="text"
                    value={toUserId}
                    onChange={(e) => setToUserId(e.target.value)}
                    placeholder="ユーザーIDを入力"
                    className="input-senior"
                    required
                  />
                </div>

                <div className="space-y-3">
                  <Label htmlFor="amount" className="text-lg text-text">
                    送金額（コイン）
                  </Label>
                  <Input
                    id="amount"
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0"
                    min="1"
                    max={balance}
                    className="input-senior"
                    required
                  />
                </div>

                <div className="space-y-3">
                  <Label htmlFor="message" className="text-lg text-text">
                    メッセージ（任意）
                  </Label>
                  <Textarea
                    id="message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="メッセージを入力（任意）"
                    className="input-senior resize-none"
                    rows={3}
                    maxLength={500}
                  />
                </div>

                <Button
                  type="submit"
                  disabled={transferMutation.isPending}
                  className="w-full button-senior bg-primary hover:bg-blue-600 text-white"
                >
                  {transferMutation.isPending ? (
                    <>
                      <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-3"></div>
                      送金中...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5 mr-2" />
                      コインを送金
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-text mb-4">送金履歴</h2>
            {transactions.length === 0 ? (
              <Card className="card-senior">
                <CardContent className="text-center py-8">
                  <History className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-lg text-gray-600">送金履歴がありません</p>
                </CardContent>
              </Card>
            ) : (
              transactions.map((transaction) => (
                <Card key={transaction.id} className="card-senior">
                  <CardContent className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <User className="text-orange-600 w-6 h-6" />
                      </div>
                      <div className="flex-1">
                        <p className="text-lg font-semibold text-text mb-1">
                          {transaction.fromUserId ? "送金受取" : "コイン受取"}
                        </p>
                        {transaction.message && (
                          <p className="text-base text-gray-600 mb-2">
                            {transaction.message}
                          </p>
                        )}
                        <p className="text-sm text-gray-500">
                          {new Date(transaction.createdAt).toLocaleDateString('ja-JP', {
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
                      <p className="text-lg font-bold text-orange-600">
                        +{transaction.amount}
                      </p>
                      <p className="text-sm text-gray-500">コイン</p>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}