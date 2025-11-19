import { useState, useEffect } from "react";
import { Scan, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useQRScanner } from "@/hooks/useQRScanner";
import { api } from "@/lib/api";

export const QRScanner = () => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    const scannerId = params.get("scannerId") || "";

    const [userId, setUserId] = useState(""); // ✅ user input ID
    const [location, setLocation] = useState({lat: "", lon: ""})
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [scanCount, setScanCount] = useState(0);
    const [lastScan, setLastScan] = useState<any>(null);

    const { toast } = useToast();
    const {
        videoRef,
        canvasRef,
        isScanning,
        hasPermission,
        startScanning,
        stopScanning,
        toggleScanning,
    } = useQRScanner({
        onScan: handleScan,
        continuous: false,
        facingMode: "environment",
    });

    // Stop auto-start scanning ✅
    useEffect(() => {
        validateToken();
        getUserLocation();
    }, []);

    async function getUserLocation(){
      if (!navigator.geolocation) {
    console.warn("Geolocation not supported.");
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const { latitude, longitude } = pos.coords;
      setLocation({ lat: latitude.toString(), lon: longitude.toString() });
      console.log("📍 Location captured:", latitude, longitude);
    },
    (err) => {
      console.warn("Location access denied or unavailable:", err.message);
      // fallback to empty strings
      setLocation({ lat: "", lon: "" });
    },
    { enableHighAccuracy: true, timeout: 10000 }
  );
  }
    
    async function validateToken() {
        if (!token) {
            setError("Invalid scanner URL");
            setLoading(false);
            return;
        }
        try {
            setLoading(true);
            const validation = await api.exhibitors.validateToken(token);
            if (!validation.isValid) {
                setError("Invalid or expired token");
                return;
            }
            if (!validation.isActive) {
                setError("This scanner is inactive");
                return;
            }
            setError(null);
        } catch {
            setError("Failed to validate scanner access");
        } finally {
            setLoading(false);
        }
    }

    // ✅ Scanning handler
    async function handleScan(result: any) {
        if (result.success && result.data) {
            stopScanning();

            if (!userId.trim()) {
                toast({
                    title: "Missing ID",
                    description: "Please enter an ID before scanning.",
                    variant: "destructive",
                });
                return;
            }

            const payload = {
                qrData: result.data,
                timestamp: new Date().toISOString(),
            };

            console.log("Scan payload:", payload);

            try {
                const res = await api.scans.recordScan(JSON.stringify(payload),userId,scannerId,location.lat,location.lon);
                toast({
                    title: "✅ Scan Successful",
                    description: `Data for ${userId} recorded.`,
                });
                setScanCount((p) => p + 1);
                setLastScan(result.data);
                setUserId(""); // ✅ clear input after successful scan
            } catch (err) {
                toast({
                    title: "Error",
                    description: "Failed to save scan data",
                    variant: "destructive",
                });
            }
        }
    }

    if (loading)
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p>Validating scanner...</p>
            </div>
        );

    if (error)
        return (
            <div className="min-h-screen flex items-center justify-center text-center">
                <Card>
                    <CardContent className="p-6">
                        <AlertCircle className="h-8 w-8 mx-auto mb-2 text-destructive" />
                        <p>{error}</p>
                    </CardContent>
                </Card>
            </div>
        );

    return (
        <div className="min-h-screen bg-gradient-card p-4">
            <div className="max-w-4xl mx-auto space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Scan className="h-5 w-5 text-primary" />
                            Camera Scanner
                        </CardTitle>
                        <CardDescription>
                            Enter your ID, then tap to start scanning
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-4">
                        {/* ✅ Input field appears only when not scanning */}
                        {!isScanning && (
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-muted-foreground">
                                    Enter ID before scanning:
                                </label>
                                <input
                                    type="text"
                                    className="w-full p-2 border rounded-md"
                                    value={userId}
                                    onChange={(e) => setUserId(e.target.value)}
                                    placeholder="Enter ID here..."
                                />
                            </div>
                        )}

                        {/* Video feed */}
                        <div className="relative bg-black rounded-lg overflow-hidden">
                            <video
                                ref={videoRef}
                                className="w-full aspect-video object-cover"
                                playsInline
                                muted
                                autoPlay
                            />
                            <canvas ref={canvasRef} className="hidden" />

                            {/* Focus overlay */}
                            <div
                                className="absolute inset-0 flex items-center justify-center"
                                onClick={() => {
                                  if (!isScanning) {
                                    if (!userId.trim()) {
                                      toast({
                                        title: "Missing ID",
                                        description: "Please enter your ID before starting the scan.",
                                        variant: "destructive",
                                      });
                                      return; // stop scanning start
                                    }
                                    startScanning(); // ✅ only start if ID is provided
                                  } else {
                                    stopScanning(); // ✅ stop scanning normally
                                  }
                                }}
                            >
                                <div className="border-2 border-white border-dashed rounded-lg w-64 h-64 flex items-center justify-center cursor-pointer">
                                    <p className="text-white text-center">
                                        {isScanning ? "Scanning..." : "Tap to Start Scanning"}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Permission warning */}
                        {hasPermission === false && (
                            <div className="text-center p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                                <AlertCircle className="h-6 w-6 text-destructive mx-auto mb-2" />
                                <p className="text-sm text-destructive">
                                    Camera access denied. Please allow permissions and refresh.
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* ✅ Last scan summary */}
                {lastScan && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Last Scan</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p>QR Data: {lastScan}</p>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
};
