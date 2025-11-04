import { useState, useEffect } from 'react';
// import { useParams, useSearchParams, useLocation } from 'react-router-dom';
import { Camera, CheckCircle, XCircle, User, Building, Mail, Phone, Scan, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useQRScanner } from '@/hooks/useQRScanner';
import { Exhibitor, ScanResult, QRCodeData } from '@/types/exhibition';
import { api } from '@/lib/api';

export const QRScanner = () => {
  const params = new URLSearchParams(window.location.search);
  const token = params.get('token');
  console.log(`Token Params: ${token}`);

  const [exhibitor, setExhibitor] = useState<Exhibitor | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastScan, setLastScan] = useState<ScanResult | null>(null);
  const [scanCount, setScanCount] = useState(0);

  const { toast } = useToast();

  const { videoRef, canvasRef, isScanning, startScanning, stopScanning, hasPermission } = useQRScanner({
    onScan: handleScan,
    continuous: true,
    facingMode: 'environment'
  });

  useEffect(() => {
    validateExhibitor();
  }, [token]);

  // Auto-start scanning when exhibitor is validated
  useEffect(() => {
    if (exhibitor && !isScanning && hasPermission !== false) {
      startScanning();
    }
  }, [exhibitor]);

  const validateExhibitor = async () => {
    if (!token) {
      setError('Invalid scanner URL');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const exhibitorData = {
        id:"exhibitor-1",
        name:"test",
        company:"test",
        email:"test",
        phoneNumber:"test",
        isActive:true,
        exhibitionId: "test",
        secureToken: "test",
        scannerUrl: "test",
        createdAt: "test",
        updatedAt: "test"
      }
      const validationResults = await api.exhibitors.validateToken(token);
      console.log(`Token Validity: ${validationResults.isValid} & Exhibitor Activity: ${validationResults.isActive}`);

      if (!validationResults.isValid) {
        setError('Invalid or expired user token');
        return;
      }

      if (!validationResults.isActive) {
        setError('This scanner has been deactivated');
        return;
      }

      // setExhibitor(exhibitorData);
      setError(null);
    } catch (err) {
      setError('Failed to validate scanner access');
    } finally {
      setLoading(false);
    }
  };

  async function handleScan(result: ScanResult) {
    setLastScan(result);


    if (result.success && result.data && exhibitor) {
      try {
        // await api.scans.recordScan(exhibitor.id, result.data);
        setScanCount(prev => prev + 1);

        toast({
          title: "Scan Successful!",
          description: `Captured data for ${result.data}`,
        });
      } catch (error) {
        let h = JSON.stringify(result, null, 2)
        console.log(h);
        toast({
          title: "Error",
          description: `Failed to save scan data ${h}`,
          variant: "destructive"
        });
      }
    } else {
      toast({
        title: "Invalid QR Code",
        description: result.error || "Could not read customer data",
        variant: "destructive"
      });
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-card flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-6">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Validating scanner access...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-card flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-6">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Access Denied</h3>
            <p className="text-muted-foreground mb-4">{error}</p>
            <p className="text-sm text-muted-foreground">
              Please contact the exhibition administrator for a valid scanner link.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-card">
      {/* Header */}
      <div className="bg-gradient-hero text-white">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold mb-1">QR Code Scanner</h1>
              <p className="text-white/80">
                {exhibitor?.company} • {exhibitor?.name}
              </p>
            </div>
            <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
              {scanCount} scans
            </Badge>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 space-y-6">
        {/* Scanner Card */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Scan className="h-5 w-5 text-primary" />
              Camera Scanner
            </CardTitle>
            <CardDescription>
              Point your camera at a customer QR code to scan their information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Camera Feed */}
              <div className="relative bg-black rounded-lg overflow-hidden">
                <video
                  ref={videoRef}
                  className="w-full aspect-video object-cover"
                  playsInline
                  muted
                />
                <canvas
                  ref={canvasRef}
                  className="hidden"
                />

                {/* Overlay */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="border-2 border-white border-dashed rounded-lg w-64 h-64 flex items-center justify-center">
                    <div className="text-white text-center">
                      <Scan className="h-8 w-8 mx-auto mb-2 opacity-75" />
                      <p className="text-sm opacity-75">Position QR code here</p>
                    </div>
                  </div>
                </div>
              </div>

              {hasPermission === false && (
                <div className="text-center p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <AlertCircle className="h-6 w-6 text-destructive mx-auto mb-2" />
                  <p className="text-sm text-destructive">
                    Camera access denied. Please allow camera permissions and refresh the page.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Last Scan Result */}
        {lastScan && (
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {lastScan.success ? (
                  <CheckCircle className="h-5 w-5 text-accent" />
                ) : (
                  <XCircle className="h-5 w-5 text-destructive" />
                )}
                Last Scan Result
              </CardTitle>
              <CardDescription>
                {new Date(lastScan.timestamp).toLocaleString()}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {lastScan.success && lastScan.data ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{lastScan.data}</span>
                    </div>
                    {/* <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{lastScan.data.email}</span>
                    </div> */}
                    {/* {lastScan.data.company && (
                      <div className="flex items-center gap-2">
                        <Building className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{lastScan.data.company}</span>
                      </div>
                    )} */}
                    {/* {lastScan.data.phoneNumber && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{lastScan.data.phoneNumber}</span>
                      </div>
                    )} */}
                  </div>
                  {/* {lastScan.data.jobTitle && (
                    <div className="pt-2 border-t">
                      <Badge variant="outline">{lastScan.data.jobTitle}</Badge>
                    </div>
                  )} */}
                </div>
              ) : (
                <div className="text-center py-4">
                  <XCircle className="h-8 w-8 text-destructive mx-auto mb-2" />
                  <p className="text-sm text-destructive">{lastScan.error}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

      </div>
    </div>
  );
};