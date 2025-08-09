import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Star, Shield, Gift, QrCode } from "lucide-react";

export default function Landing() {
  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-md mx-auto px-6 py-4">
          <div className="flex items-center justify-center">
            <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center mr-4">
              <Star className="text-white w-6 h-6" />
            </div>
            <div className="text-center">
              <h1 className="text-xl font-bold text-text">ロイヤルティ</h1>
              <p className="text-sm text-gray-600">ポイントアプリ</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto px-6 pb-8">
        {/* Hero Section */}
        <div className="text-center py-12">
          <div className="w-24 h-24 bg-primary rounded-full flex items-center justify-center mx-auto mb-6">
            <Star className="text-white w-12 h-12" />
          </div>
          <h2 className="text-senior-2xl font-bold text-text mb-4">
            簡単で安全な<br />ポイント管理
          </h2>
          <p className="text-senior text-gray-600 mb-8">
            パスキー認証で安全にログインして、<br />
            お得にポイントを貯めましょう
          </p>
        </div>

        {/* Features */}
        <div className="space-y-6 mb-12">
          <Card className="card-senior">
            <CardContent className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-success rounded-full flex items-center justify-center flex-shrink-0">
                <QrCode className="text-white w-8 h-8" />
              </div>
              <div>
                <h3 className="text-senior-lg font-semibold text-text mb-1">
                  QRコードで簡単チェックイン
                </h3>
                <p className="text-senior text-gray-600">
                  店舗のQRコードをスキャンするだけ
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="card-senior">
            <CardContent className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                <Shield className="text-white w-8 h-8" />
              </div>
              <div>
                <h3 className="text-senior-lg font-semibold text-text mb-1">
                  安全なパスキー認証
                </h3>
                <p className="text-senior text-gray-600">
                  パスワード不要の最新セキュリティ
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="card-senior">
            <CardContent className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center flex-shrink-0">
                <Gift className="text-white w-8 h-8" />
              </div>
              <div>
                <h3 className="text-senior-lg font-semibold text-text mb-1">
                  お得な特典とランク
                </h3>
                <p className="text-senior text-gray-600">
                  利用頻度に応じて特典をゲット
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Login Button */}
        <div className="space-y-4">
          <Button 
            onClick={handleLogin}
            className="w-full button-senior bg-primary hover:bg-blue-600 text-white"
          >
            <Shield className="w-5 h-5 mr-3" />
            安全ログインで始める
          </Button>
          
          <p className="text-center text-gray-500 text-base">
            初回ご利用の方は新規登録から開始します
          </p>
        </div>
      </main>
    </div>
  );
}
