"use client";

import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface ModuleCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  onConfigure?: () => void;
  loading?: boolean;
  configurable?: boolean;
  color?: string;
}

export function ModuleCard({
  title,
  description,
  icon,
  enabled,
  onToggle,
  onConfigure,
  loading = false,
  configurable = true,
  color = "#5865F2",
}: ModuleCardProps) {
  const [isToggling, setIsToggling] = useState(false);

  const handleToggle = async (newValue: boolean) => {
    setIsToggling(true);
    await onToggle(newValue);
    setIsToggling(false);
  };

  return (
    <Card className={cn(
      "relative overflow-hidden transition-all duration-200 hover:shadow-lg",
      enabled && "ring-2 ring-primary/20"
    )}>
      {/* Üst renk şeridi */}
      <div 
        className="absolute top-0 left-0 right-0 h-1"
        style={{ backgroundColor: enabled ? color : "#6b7280" }}
      />
      
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div 
              className={cn(
                "p-2 rounded-lg transition-colors",
                enabled ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
              )}
              style={{ 
                backgroundColor: enabled ? `${color}20` : undefined,
                color: enabled ? color : undefined
              }}
            >
              {icon}
            </div>
            <div>
              <CardTitle className="text-base">{title}</CardTitle>
              <CardDescription className="text-xs mt-0.5">{description}</CardDescription>
            </div>
          </div>
          
          <Switch
            checked={enabled}
            onCheckedChange={handleToggle}
            disabled={loading || isToggling}
          />
        </div>
      </CardHeader>
      
      {configurable && enabled && (
        <CardContent className="pt-2 pb-4">
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-between"
            onClick={onConfigure}
          >
            <span className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Ayarları Düzenle
            </span>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </CardContent>
      )}
    </Card>
  );
}
