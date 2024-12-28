import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import * as faceapi from "face-api.js";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Upload } from "lucide-react";

const ImageUpload = () => {
  const navigate = useNavigate();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<string>("");
  const imageRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setSelectedImage(e.target?.result as string);
        setAnalysis("");
      };
      reader.readAsDataURL(file);
    }
  };

  const analyzeImage = async () => {
    if (!selectedImage || !imageRef.current || !canvasRef.current) return;

    setIsAnalyzing(true);
    try {
      await faceapi.nets.tinyFaceDetector.loadFromUri("/models");
      await faceapi.nets.faceLandmark68Net.loadFromUri("/models");
      await faceapi.nets.faceRecognitionNet.loadFromUri("/models");
      await faceapi.nets.faceExpressionNet.loadFromUri("/models");
      await faceapi.nets.ageGenderNet.loadFromUri("/models");

      const image = imageRef.current;
      const canvas = canvasRef.current;

      const displaySize = { width: image.width, height: image.height };
      faceapi.matchDimensions(canvas, displaySize);

      const detections = await faceapi
        .detectAllFaces(image, new faceapi.TinyFaceDetectorOptions())
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
      } else {
        setAnalysis("No face detected in the image.");
      }
    } catch (error) {
      console.error("Error analyzing image:", error);
      setAnalysis("Error analyzing image. Please try again.");
    }
    setIsAnalyzing(false);
  };

  return (
    <div className="min-h-screen bg-slate-900 p-4">
      <Button
        variant="ghost"
        className="text-white mb-4"
        onClick={() => navigate("/")}
      >
        <ArrowLeft className="mr-2" /> Back
      </Button>

      <div className="max-w-3xl mx-auto">
        <div className="flex justify-center mb-4">
          <Button
            className="w-40"
            onClick={() => document.getElementById("imageInput")?.click()}
          >
            <Upload className="mr-2" /> Upload Image
          </Button>
          <input
            id="imageInput"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageUpload}
          />
        </div>

        {selectedImage && (
          <>
            <div className="relative w-full max-h-[70vh] bg-slate-800 rounded-lg overflow-hidden">
              <img
                ref={imageRef}
                src={selectedImage}
                alt="Uploaded"
                className="w-full h-full object-contain"
              />
              <canvas
                ref={canvasRef}
                className="absolute top-0 left-0 w-full h-full"
              />
            </div>

            <div className="flex justify-center mt-4">
              <Button
                className="w-32"
                onClick={analyzeImage}
                disabled={isAnalyzing}
              >
                {isAnalyzing ? "Analyzing..." : "Analyze"}
              </Button>
            </div>

            {analysis && (
              <Card className="mt-4 p-4 bg-slate-800 text-white">
                <pre className="whitespace-pre-wrap">{analysis}</pre>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ImageUpload;