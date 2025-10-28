import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { QrCode } from 'lucide-react';

const Index = () => {
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

        {/* Start Scanning Button */}
        <Button asChild size="lg" className="w-full">
          <Link to="/scanner/demo-exhibitor">
            Start Scanning
          </Link>
        </Button>

        {/* Admin Link */}
        <p className="text-xs text-muted-foreground">
          Are you an admin?{' '}
          <Link to="/admin" className="text-primary hover:underline">
            Go to Dashboard
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Index;
