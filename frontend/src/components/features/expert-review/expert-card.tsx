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
    <Card className="flex flex-col justify-between border border-[#d1d6da] bg-white hover:border-[#5bbbae] hover:shadow-md transition-all duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-start gap-4">
          <Avatar
            src={expert.avatar_url}
            name={expert.full_name}
            size="lg"
            className="border-2 border-[#5bbbae]/20 shrink-0"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <h3 className="text-base font-bold text-[#252525] truncate">
                {expert.full_name}
              </h3>
              <ShieldCheck className="h-4 w-4 text-[#5bbbae] shrink-0" />
            </div>
            <p className="text-xs font-medium text-[#5bbbae] truncate">{expert.headline}</p>
            <div className="flex items-center gap-3 mt-1.5 text-xs text-[#777777]">
              <span className="flex items-center gap-1">
                <Briefcase className="h-3 w-3 text-[#999999]" />
                {expert.company}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                <span className="font-semibold text-[#252525]">{Number(expert.rating).toFixed(2)}</span>
                <span>({expert.total_reviews_count})</span>
              </span>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="py-2 flex-1">
        <p className="text-xs text-[#666666] line-clamp-3 leading-relaxed mb-4">
          {expert.bio}
        </p>

        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#f2f4f6]">
          <Badge variant="secondary" className="text-[11px] bg-[#f0f4f8] text-[#334e68]">
            {expert.role_category}
          </Badge>
          <Badge variant="outline" className="text-[11px] border-[#e2e8f0] text-[#64748b]">
            {expert.years_of_experience}+ yrs exp
          </Badge>
          <div className="ml-auto flex items-center gap-1 text-[11px] text-[#515151]">
            <Clock className="h-3 w-3 text-[#5bbbae]" />
            <span>~{expert.turn_around_days} days</span>
          </div>
        </div>
      </CardContent>

      <CardFooter className="pt-3 pb-4">
        <Button
          onClick={() => onRequestReview(expert)}
          variant="outline"
          size="sm"
          className="w-full border-[#5bbbae] text-[#5bbbae] hover:bg-[#5bbbae] hover:text-white transition-colors"
        >
          Request Review with {expert.full_name.split(" ")[0]}
        </Button>
      </CardFooter>
    </Card>
  );
}
