import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Coins, Send, History, ArrowLeft, User, Book, Star, Heart } from "lucide-react";
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

interface AddressBookEntry {
  id: string;
  userId: string;
  recipientUserId: string;
  nickname: string;
  isFavorite: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function CoinTransfer() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"send" | "history" | "addressbook">("send");
  const [toUserId, setToUserId] = useState("");
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");

  // Mutation for updating address book entry
  const updateAddressBookMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<AddressBookEntry> }) => {
      const response = await fetch(`/api/address-book/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      
      if (!response.ok) {
        throw new Error(`${response.status}: ${response.statusText}`);
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/address-book"] });
      toast({
        title: "成功",
        description: data.message,
      });
    },
    onError: (error) => {
      toast({
        title: "エラー",
        description: error.message,
        variant: "destructive",
      });
    },
  });

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

  // Fetch address book
  const { data: addressBook = [] } = useQuery<AddressBookEntry[]>({
    queryKey: ["/api/address-book"],
    enabled: activeTab === "addressbook" || activeTab === "send",
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
        <div className="grid grid-cols-3 gap-2 mb-6">
          <Button
            variant={activeTab === "send" ? "default" : "outline"}
            onClick={() => setActiveTab("send")}
            className="button-senior text-sm"
          >
            <Send className="w-4 h-4 mr-1" />
            送金
          </Button>
          <Button
            variant={activeTab === "addressbook" ? "default" : "outline"}
            onClick={() => setActiveTab("addressbook")}
            className="button-senior text-sm"
          >
            <Book className="w-4 h-4 mr-1" />
            アドレス帳
          </Button>
          <Button
            variant={activeTab === "history" ? "default" : "outline"}
            onClick={() => setActiveTab("history")}
            className="button-senior text-sm"
          >
            <History className="w-4 h-4 mr-1" />
            履歴
          </Button>
        </div>

        {activeTab === "send" ? (
          <div className="space-y-6">
            {/* Quick Send - Address Book */}
            {addressBook.length > 0 && (
              <Card className="card-senior">
                <CardHeader>
                  <CardTitle className="text-lg text-text">よく送る相手</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {addressBook.filter(entry => entry.isFavorite).slice(0, 3).map((entry) => (
                      <Button
                        key={entry.id}
                        onClick={() => setToUserId(entry.recipientUserId)}
                        variant="outline"
                        className="w-full flex items-center justify-start p-4 h-auto"
                      >
                        <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center mr-3">
                          <Star className="w-5 h-5 text-orange-600" />
                        </div>
                        <span className="text-lg">{entry.nickname}</span>
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

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
          </div>
        ) : activeTab === "addressbook" ? (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-text mb-4">アドレス帳</h2>
            {addressBook.length === 0 ? (
              <Card className="card-senior">
                <CardContent className="text-center py-8">
                  <Book className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-lg text-gray-600">アドレス帳が空です</p>
                  <p className="text-sm text-gray-500 mt-2">送金すると自動的に追加されます</p>
                </CardContent>
              </Card>
            ) : (
              addressBook.map((entry) => (
                <Card key={entry.id} className="card-senior">
                  <CardContent className="flex items-center justify-between py-4">
                    <div className="flex items-center space-x-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        entry.isFavorite ? 'bg-yellow-100' : 'bg-gray-100'
                      }`}>
                        {entry.isFavorite ? (
                          <Star className="w-6 h-6 text-yellow-600" />
                        ) : (
                          <User className="w-6 h-6 text-gray-600" />
                        )}
                      </div>
                      <div>
                        <p className="text-lg font-semibold text-text">
                          {entry.nickname}
                        </p>
                        <p className="text-sm text-gray-500">
                          {entry.recipientUserId}
                        </p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        onClick={() => {
                          updateAddressBookMutation.mutate({
                            id: entry.id,
                            updates: { isFavorite: !entry.isFavorite }
                          });
                        }}
                        variant="ghost"
                        size="sm"
                        className="p-2"
                      >
                        {entry.isFavorite ? (
                          <Heart className="w-5 h-5 text-red-500 fill-current" />
                        ) : (
                          <Heart className="w-5 h-5 text-gray-400" />
                        )}
                      </Button>
                      <Button
                        onClick={() => {
                          setToUserId(entry.recipientUserId);
                          setActiveTab("send");
                        }}
                        size="sm"
                        className="bg-primary hover:bg-blue-600 text-white"
                      >
                        送金
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
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