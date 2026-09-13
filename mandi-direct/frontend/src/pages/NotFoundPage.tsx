import React from "react";
import { Link } from "react-router-dom";
import { Sprout, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export const NotFoundPage: React.FC = () => {
  return (
    <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center px-4 text-center">
      <div className="max-w-md space-y-4">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary text-emerald-400">
          <Sprout className="h-8 w-8" />
        </div>
        <h1 className="text-4xl font-extrabold text-white">404</h1>
        <p className="text-slate-400 text-sm">The page or lot you requested could not be found.</p>
        <Link to="/">
          <Button variant="harvest" className="gap-2 mt-4">
            <Home className="h-4 w-4" /> Return to Mandi Direct
          </Button>
        </Link>
      </div>
    </div>
  );
};
