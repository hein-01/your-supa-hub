import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

interface BackButtonProps {
  to?: string;
  className?: string;
  onClick?: () => void;
}

export const BackButton = ({ to = "/dashboard", className = "", onClick }: BackButtonProps) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      navigate(to);
    }
  };

  return (
    <div className={`flex items-center gap-3 mb-6 ${className}`}>
      <Button
        onClick={handleClick}
        className="h-10 w-10 rounded-full bg-purple-200 hover:bg-purple-300 shadow-md border-0 p-0 flex items-center justify-center transition-all duration-200"
        variant="outline"
      >
        <ArrowLeft className="h-5 w-5 text-purple-700" />
      </Button>
      <span 
        className="text-purple-700 font-medium cursor-pointer hover:text-purple-800 transition-colors"
        onClick={handleClick}
      >
        Back
      </span>
    </div>
  );
};