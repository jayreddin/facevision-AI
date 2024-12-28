import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 p-4">
      <h1 className="text-4xl font-bold text-white mb-8">Facial Analysis App</h1>
      <div className="flex flex-col sm:flex-row gap-4">
        <Button
          className="min-w-[200px] h-12 text-lg bg-slate-700 hover:bg-slate-600"
          onClick={() => navigate("/live-face")}
        >
          Live Face
        </Button>
        <Button
          className="min-w-[200px] h-12 text-lg bg-slate-700 hover:bg-slate-600"
          onClick={() => navigate("/image-upload")}
        >
          Image Upload
        </Button>
      </div>
    </div>
  );
};

export default Index;