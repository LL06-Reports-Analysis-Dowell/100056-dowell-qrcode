import { useState, useEffect } from "react";
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { QrCode } from 'lucide-react';
// import { useParams, useSearchParams, useLocation, urlSearchParams } from 'react-router-dom';

const Index = () => {
  const [scannerId, setScannerId] = useState(""); 
  const params = new URLSearchParams(window.location.search);
  const token = params.get('token');
  console.log(`Token Params from Index.tsx: ${token}`);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-8">
      <div className="w-full max-w-md text-center space-y-6">
        {/* Icon */}
        <div className="flex justify-center mb-4">
          <div className="bg-primary/10 rounded-full p-4">
            <QrCode className="h-12 w-12 text-primary" />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-foreground">
          Welcome to the Exhibitor Scanner
        </h1>

        {/* Instructions */}
        <div className="space-y-3 text-left bg-card rounded-lg p-6 shadow-card">
          <ul className="space-y-3 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              <span>Click "Allow" when prompted to enable camera access.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              <span>Hold the QR code within the frame of your device's screen.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              <span>Wait for the scan to complete — no need to press anything.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              <span>You'll receive confirmation once the data is captured.</span>
            </li>
          </ul>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">
            Scanner ID (your ID)
          </label>
          <input
            type="text"
            placeholder="Enter your scanner ID"
            value={scannerId}
            onChange={(e) => setScannerId(e.target.value)}
            className="w-full"
          />
        </div>
        {/* Start Scanning Button */}
        <Button
          asChild
          size="lg"
          className="w-full"
          disabled={!scannerId.trim()}  // prevents navigation without ID
        >
          <Link to={`/scanner/?token=${token}&scannerId=${scannerId}`}>
            Start Scanning
          </Link>
        </Button>
        
      </div>
    </div>
  );
};

export default Index;
