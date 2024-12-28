import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import * as faceapi from "face-api.js";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const LiveFace = () => {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const [analysis, setAnalysis] = useState<string>("");
  const streamRef = useRef<MediaStream | null>(null);

  const loadModels = async () => {
    const MODEL_URL = "/models";
    try {
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
        faceapi.nets.ageGenderNet.loadFromUri(MODEL_URL),
      ]);
    } catch (error) {
      console.error("Error loading models:", error);
    }
  };

  const startVideo = async () => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsPlaying(true);
      }
    } catch (error) {
      console.error("Error accessing camera:", error);
    }
  };

  const stopVideo = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsPlaying(false);
  };

  const flipCamera = () => {
    setFacingMode(prev => prev === "user" ? "environment" : "user");
    if (isPlaying) {
      stopVideo();
      setTimeout(startVideo, 300);
    }
  };

  useEffect(() => {
    loadModels();
  }, []);

  useEffect(() => {
    if (!videoRef.current || !isPlaying) return;

    const video = videoRef.current;
    video.addEventListener("play", () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const displaySize = {
        width: video.videoWidth,
        height: video.videoHeight
      };

      faceapi.matchDimensions(canvas, displaySize);

      setInterval(async () => {
        if (!video || !canvas) return;

        const detections = await faceapi
          .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
          .withFaceLandmarks()
          .withFaceExpressions()
          .withAgeAndGender();

        const resizedDetections = faceapi.resizeResults(detections, displaySize);
        canvas.getContext("2d")?.clearRect(0, 0, canvas.width, canvas.height);
        
        faceapi.draw.drawDetections(canvas, resizedDetections);
        faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);

        if (detections[0]) {
          const detection = detections[0];
          const expressions = detection.expressions;
          const dominantExpression = Object.entries(expressions)
            .reduce((a, b) => a[1] > b[1] ? a : b)[0];

          setAnalysis(`
            Age: ${Math.round(detection.age)} years
            Gender: ${detection.gender} (${Math.round(detection.genderProbability * 100)}% confidence)
            Expression: ${dominantExpression}
          `);
        }
      }, 100);
    });
  }, [isPlaying]);

  return (
    <div className="min-h-screen bg-slate-900 p-4">
      <Button
        variant="ghost"
        className="text-white mb-4 w-full sm:w-auto border border-white/20"
        onClick={() => navigate("/")}
      >
        <ArrowLeft className="mr-2" /> Back
      </Button>

      <div className="max-w-3xl mx-auto">
        <div className="flex justify-center mb-4">
          <Button
            className={`w-full sm:max-w-md border border-white/20 ${
              isPlaying ? "bg-[#ea384c] hover:bg-[#ea384c]/90" : ""
            }`}
            onClick={isPlaying ? stopVideo : startVideo}
          >
            Camera {isPlaying ? "Off" : "On"}
          </Button>
        </div>

        <div className="relative w-full aspect-video bg-slate-800 rounded-lg overflow-hidden">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
          <canvas
            ref={canvasRef}
            className="absolute top-0 left-0 w-full h-full"
          />
        </div>

        <div className="flex justify-center mt-4">
          <Button
            className="w-full sm:max-w-md border border-white/20"
            onClick={flipCamera}
            disabled={!isPlaying}
          >
            Flip Camera
          </Button>
        </div>

        <Card className="mt-4 p-4 bg-slate-800 text-white">
          <pre className="whitespace-pre-wrap">{analysis}</pre>
        </Card>
      </div>
    </div>
  );
};

export default LiveFace;
