import { CheckCircle } from "lucide-react";

interface SuccessToastProps {
  storeName: string;
  points: number;
}

export default function SuccessToast({ storeName, points }: SuccessToastProps) {
  return (
    <div className="fixed top-20 left-4 right-4 bg-success text-white p-4 rounded-xl shadow-lg z-50 max-w-md mx-auto animate-in slide-in-from-top duration-300">
      <div className="flex items-center">
        <CheckCircle className="w-6 h-6 mr-3 flex-shrink-0" />
        <div className="flex-1">
          <p className="text-lg font-semibold">チェックイン完了！</p>
          <p className="text-base opacity-90">
            {storeName}で{points}ポイント獲得しました
          </p>
        </div>
      </div>
    </div>
  );
}
