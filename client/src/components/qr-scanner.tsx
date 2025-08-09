import { useState, useEffect, useRef } from "react";
import { X, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";

interface QRScannerProps {
  onScan: (code: string) => void;
  onClose: () => void;
  isLoading?: boolean;
}

export default function QRScanner({ onScan, onClose, isLoading }: QRScannerProps) {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    requestCameraPermission();
    
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const requestCameraPermission = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      setStream(mediaStream);
      setHasPermission(true);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      console.error('Camera permission denied:', error);
      setHasPermission(false);
    }
  };

  const handleTestScan = () => {
    // For demo purposes, simulate scanning a test QR code
    onScan('test-store-qr-code-123');
  };

  const handleClose = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex flex-col items-center justify-center p-6 z-50">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-white mb-4">QRコードスキャン</h2>
        <p className="text-lg text-gray-300">店舗のQRコードをカメラに向けてください</p>
      </div>
      
      <div className="w-80 h-80 bg-gray-800 rounded-2xl flex items-center justify-center mb-8 relative overflow-hidden">
        {hasPermission === null && (
          <div className="text-center">
            <div className="animate-spin w-8 h-8 border-4 border-white border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-white">カメラを準備中...</p>
          </div>
        )}
        
        {hasPermission === false && (
          <div className="text-center p-6">
            <Camera className="w-12 h-12 text-gray-500 mx-auto mb-4" />
            <p className="text-white mb-4">カメラのアクセス許可が必要です</p>
            <Button
              onClick={requestCameraPermission}
              className="bg-primary hover:bg-blue-600 text-white"
            >
              許可を再要求
            </Button>
          </div>
        )}
        
        {hasPermission === true && (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            
            {/* Scanning overlay */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-64 h-64 border-4 border-white rounded-lg relative">
                <div className="absolute top-0 left-0 w-8 h-8 border-l-4 border-t-4 border-primary rounded-tl"></div>
                <div className="absolute top-0 right-0 w-8 h-8 border-r-4 border-t-4 border-primary rounded-tr"></div>
                <div className="absolute bottom-0 left-0 w-8 h-8 border-l-4 border-b-4 border-primary rounded-bl"></div>
                <div className="absolute bottom-0 right-0 w-8 h-8 border-r-4 border-b-4 border-primary rounded-br"></div>
              </div>
            </div>
          </>
        )}
      </div>
      
      <div className="flex flex-col space-y-4">
        {/* Demo button for testing */}
        <Button
          onClick={handleTestScan}
          disabled={isLoading}
          className="bg-success hover:bg-green-600 text-white button-senior"
        >
          {isLoading ? (
            <>
              <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-3"></div>
              チェックイン中...
            </>
          ) : (
            'テスト用QRコード'
          )}
        </Button>
        
        <Button
          onClick={handleClose}
          disabled={isLoading}
          className="bg-gray-700 hover:bg-gray-600 text-white button-senior"
        >
          <X className="w-5 h-5 mr-3" />
          キャンセル
        </Button>
      </div>
    </div>
  );
}
