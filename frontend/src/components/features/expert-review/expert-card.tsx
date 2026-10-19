"use client";

import { Star, ShieldCheck, Clock, Briefcase } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { ExpertProfile } from "@/hooks/use-expert-review";

interface ExpertCardProps {
  expert: ExpertProfile;
  onRequestReview: (expert: ExpertProfile) => void;
}

export function ExpertCard({ expert, onRequestReview }: ExpertCardProps) {
  return (
    <Card className="flex flex-col justify-between border border-surface-border bg-surface-card hover:border-brand-primary hover:shadow-md transition-all duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-start gap-4">
          <Avatar
            src={expert.avatar_url}
            name={expert.full_name}
            size="lg"
            className="border-2 border-brand-primary/20 shrink-0"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <h3 className="text-base font-bold text-typography-main truncate">
                {expert.full_name}
              </h3>
              <ShieldCheck className="h-4 w-4 text-brand-primary shrink-0" />
            </div>
            <p className="text-xs font-medium text-brand-primary truncate">{expert.headline}</p>
            <div className="flex items-center gap-3 mt-1.5 text-xs text-typography-muted">
              <span className="flex items-center gap-1">
                <Briefcase className="h-3 w-3 text-typography-muted" />
                {expert.company}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                <span className="font-semibold text-typography-main">{Number(expert.rating).toFixed(2)}</span>
                <span>({expert.total_reviews_count})</span>
              </span>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="py-2 flex-1">
        <p className="text-xs text-typography-body line-clamp-3 leading-relaxed mb-4">
          {expert.bio}
        </p>

        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-surface-divider">
          <Badge variant="secondary" className="text-[11px] bg-surface-page text-typography-main">
            {expert.role_category}
          </Badge>
          <Badge variant="outline" className="text-[11px] border-surface-border text-typography-muted">
            {expert.years_of_experience}+ yrs exp
          </Badge>
          <div className="ml-auto flex items-center gap-1 text-[11px] text-typography-heading">
            <Clock className="h-3 w-3 text-brand-primary" />
            <span>~{expert.turn_around_days} days</span>
          </div>
        </div>
      </CardContent>

      <CardFooter className="pt-3 pb-4">
        <Button
          onClick={() => onRequestReview(expert)}
          variant="outline"
          size="sm"
          className="w-full border-brand-primary text-brand-primary hover:bg-brand-primary hover:text-white transition-colors"
        >
          Request Review with {expert.full_name.split(" ")[0]}
        </Button>
      </CardFooter>
    </Card>
  );
}
