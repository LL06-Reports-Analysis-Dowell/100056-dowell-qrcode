import { useCallback, useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';
import { QRCodeData, ScanResult } from '@/types/exhibition';
import { json } from 'stream/consumers';

interface UseQRScannerOptions {
  onScan?: (result: ScanResult) => void;
  continuous?: boolean;
  facingMode?: 'user' | 'environment';
}

export const useQRScanner = (options: UseQRScannerOptions = {}) => {
  const { onScan, continuous = true, facingMode = 'environment' } = options;
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number>();
  
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  const parseQRData = useCallback((data: string): string | null => {
    try {
      // Try to parse as JSON first
      console.log("This is data:",data);
    return data;
    //   const jsonData = JSON.parse(data);
      
    //   // Validate required fields
    //   if (jsonData.customerId && jsonData.name && jsonData.email) {
    //     return {
    //       customerId: jsonData.customerId || jsonData.id,
    //       name: jsonData.name,
    //       email: jsonData.email,
    //       phoneNumber: jsonData.phoneNumber || jsonData.phone,
    //       company: jsonData.company,
    //       jobTitle: jsonData.jobTitle || jsonData.position
    //     };
    //   }
      
    //   return jsonData;
    } catch {
    //   // If not JSON, try to parse as simple key-value pairs
    //   const lines = data.split('\n').filter(line => line.trim());
    //   const result: any = {};
      
    //   for (const line of lines) {
    //     const [key, value] = line.split(':').map(s => s.trim());
    //     if (key && value) {
    //       result[key.toLowerCase()] = value;
    //     }
    //   }
      
    //   // Map common field variations
    //   const customerId = result.customerid || result.id || result.customerId;
    //   const name = result.name || result.fullname;
    //   const email = result.email;
      
    //   if (customerId && name && email) {
    //     return {
    //       customerId,
    //       name,
    //       email,
    //       phoneNumber: result.phone || result.phonenumber,
    //       company: result.company || result.organization,
    //       jobTitle: result.position || result.jobtitle || result.title
    //     };
    //   }
      
      return null;
    };
  }, []);

  const scan = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    if (!video || !canvas || !isScanning) return;
    
    const context = canvas.getContext('2d');
    if (!context) return;

    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height);
      
      if (code) {
        const qrData = code.data;
        console.log(JSON.stringify(qrData));
        const result: ScanResult = {
          success: !!qrData,
          data: qrData || undefined,
          error: qrData ? undefined : 'Invalid QR code format',
          timestamp: new Date().toISOString()
        };
        
        onScan?.(result);
        
        if (!continuous) {
          setIsScanning(false);
        }
      }
    }
    
    if (isScanning) {
      animationFrameRef.current = requestAnimationFrame(scan);
    }
  }, [isScanning, onScan, continuous, parseQRData]);

  const startScanning = useCallback(async () => {
    try {
      setError(null);
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      
      streamRef.current = stream;
      setHasPermission(true);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setIsScanning(true);
      }
    } catch (err) {
      console.error('Error starting scanner:', err);
      setHasPermission(false);
      setError(err instanceof Error ? err.message : 'Failed to access camera');
    }
  }, [facingMode]);

  const stopScanning = useCallback(() => {
    setIsScanning(false);
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  // Start scanning when enabled
  useEffect(() => {
    if (isScanning) {
      scan();
    }
  }, [isScanning, scan]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopScanning();
    };
  }, [stopScanning]);

  return {
    videoRef,
    canvasRef,
    isScanning,
    error,
    hasPermission,
    startScanning,
    stopScanning
  };
};