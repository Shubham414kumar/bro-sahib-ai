import { useState, useRef, useEffect } from 'react';
import { Camera, CameraOff, User } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { useToast } from '@/hooks/use-toast';

interface FaceRecognitionProps {
  isActive: boolean;
  onFaceDetected?: (faceData: any) => void;
}

export const FaceRecognition = ({ isActive, onFaceDetected }: FaceRecognitionProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectedFaces, setDetectedFaces] = useState(0);
  const { toast } = useToast();
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number>();

  useEffect(() => {
    if (isActive && isCameraOn) {
      startFaceDetection();
    } else {
      stopFaceDetection();
    }
    
    return () => {
      stopCamera();
    };
  }, [isActive, isCameraOn]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 480 }
        } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsCameraOn(true);
        
        toast({
          title: "Camera Started",
          description: "Face recognition is now active",
        });
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      toast({
        title: "Camera Access Failed",
        description: "Please grant camera permissions",
        variant: "destructive",
      });
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    
    setIsCameraOn(false);
    setIsDetecting(false);
    setDetectedFaces(0);
  };

  const startFaceDetection = () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    setIsDetecting(true);
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;

    const detectFaces = () => {
      if (!video || !canvas) return;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Draw video frame to canvas
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Simple face detection simulation (in production, use a proper face detection library)
      // For now, we'll simulate detection with a basic approach
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      
      // Simulate face detection (you would use a real face detection API here)
      const faceDetected = Math.random() > 0.7; // Simulated detection
      
      if (faceDetected) {
        setDetectedFaces(1);
        
        // Draw a rectangle around the "detected" face
        ctx.strokeStyle = '#00ff00';
        ctx.lineWidth = 3;
        const faceX = canvas.width * 0.3;
        const faceY = canvas.height * 0.2;
        const faceWidth = canvas.width * 0.4;
        const faceHeight = canvas.height * 0.5;
        
        ctx.strokeRect(faceX, faceY, faceWidth, faceHeight);
        
        // Draw detection points
        ctx.fillStyle = '#00ff00';
        const points = [
          { x: faceX + faceWidth * 0.3, y: faceY + faceHeight * 0.4 }, // Left eye
          { x: faceX + faceWidth * 0.7, y: faceY + faceHeight * 0.4 }, // Right eye
          { x: faceX + faceWidth * 0.5, y: faceY + faceHeight * 0.6 }, // Nose
          { x: faceX + faceWidth * 0.5, y: faceY + faceHeight * 0.8 }, // Mouth
        ];
        
        points.forEach(point => {
          ctx.beginPath();
          ctx.arc(point.x, point.y, 3, 0, 2 * Math.PI);
          ctx.fill();
        });
        
        if (onFaceDetected) {
          onFaceDetected({
            detected: true,
            confidence: Math.random() * 0.3 + 0.7,
            timestamp: Date.now()
          });
        }
      } else {
        setDetectedFaces(0);
      }
      
      // Continue detection
      if (isDetecting) {
        animationFrameRef.current = requestAnimationFrame(detectFaces);
      }
    };
    
    // Start detection loop
    detectFaces();
  };

  const stopFaceDetection = () => {
    setIsDetecting(false);
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
  };

  const toggleCamera = () => {
    if (isCameraOn) {
      stopCamera();
    } else {
      startCamera();
    }
  };

  return (
    <Card className="p-4 bg-background/50 border-jarvis-blue/20">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-jarvis-blue">Face Recognition</h3>
          <Button
            onClick={toggleCamera}
            variant={isCameraOn ? "destructive" : "default"}
            size="sm"
          >
            {isCameraOn ? (
              <>
                <CameraOff className="h-4 w-4 mr-2" />
                Stop Camera
              </>
            ) : (
              <>
                <Camera className="h-4 w-4 mr-2" />
                Start Camera
              </>
            )}
          </Button>
        </div>
        
        <div className="relative aspect-video bg-jarvis-dark rounded-lg overflow-hidden">
          {isCameraOn ? (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="absolute inset-0 w-full h-full object-cover"
              />
              <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full"
              />
              {isDetecting && (
                <div className="absolute top-2 left-2 bg-background/80 backdrop-blur-sm px-3 py-1 rounded-full">
                  <span className="text-xs text-jarvis-blue flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    {detectedFaces > 0 ? `${detectedFaces} Face Detected` : 'Scanning...'}
                  </span>
                </div>
              )}
            </>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <User className="h-16 w-16 text-jarvis-blue/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Camera is off</p>
              </div>
            </div>
          )}
        </div>
        
        {isCameraOn && (
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Status: {isDetecting ? 'Detecting' : 'Ready'}</span>
            <span>Faces: {detectedFaces}</span>
          </div>
        )}
      </div>
    </Card>
  );
};