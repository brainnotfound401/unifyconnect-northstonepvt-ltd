import { useState } from "react";
import { Navigate } from "react-router-dom";
import SplashScreen from "@/components/SplashScreen";

const Index = () => {
  const [showSplash, setShowSplash] = useState(true);

  if (showSplash) {
    return <SplashScreen onComplete={() => setShowSplash(false)} />;
  }

  return <Navigate to="/auth" replace />;
};

export default Index;
