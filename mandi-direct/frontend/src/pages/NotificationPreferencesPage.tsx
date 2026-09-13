import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NotificationPreferencesForm } from "@/components/notifications/NotificationPreferencesForm";

export const NotificationPreferencesPage: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl space-y-6">
      {/* Breadcrumb / Back Navigation */}
      <div className="flex items-center justify-between">
        <Link to="/notifications">
          <Button
            variant="ghost"
            size="sm"
            className="text-xs h-8 gap-1.5 text-muted-foreground hover:text-white"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Notifications</span>
          </Button>
        </Link>
      </div>

      {/* Main Settings Form Card */}
      <NotificationPreferencesForm />
    </div>
  );
};

export default NotificationPreferencesPage;
