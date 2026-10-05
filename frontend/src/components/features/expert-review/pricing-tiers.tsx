"use client";

import { Check, Sparkles, Clock, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { ReviewPackage } from "@/hooks/use-expert-review";

interface PricingTiersProps {
  packages: ReviewPackage[];
  onSelectPackage: (pkg: ReviewPackage) => void;
}

export function PricingTiers({ packages, onSelectPackage }: PricingTiersProps) {
  return (
    <section id="pricing-section" className="py-16 bg-[#fbfcfc] border-b border-[#e5e9eb]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <Badge variant="teal" className="mb-3">
            Transparent Pricing
          </Badge>
          <h2 className="text-3xl font-bold tracking-tight text-[#252525]">
            Choose Your CV Review Plan
          </h2>
          <p className="mt-3 text-base text-[#666666]">
            Every review includes a line-by-line breakdown, keyword scoring, and actionable rewrites.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
          {packages.map((pkg) => {
            const isPro = pkg.is_popular;
            return (
              <Card
                key={pkg.id}
                className={`relative flex flex-col justify-between transition-all duration-200 ${
                  isPro
                    ? "border-2 border-[#5bbbae] shadow-lg shadow-[#5bbbae]/10 bg-white"
                    : "border border-[#d1d6da] bg-white hover:border-[#5bbbae]/50"
                }`}
              >
                {isPro && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#5bbbae] px-3.5 py-1 text-xs font-semibold text-white shadow-sm">
                      <Sparkles className="h-3 w-3" /> Most Popular
                    </span>
                  </div>
                )}

                <CardHeader className="pt-8 pb-4">
                  <h3 className="text-xl font-bold text-[#252525]">{pkg.name}</h3>
                  <p className="text-xs text-[#666666] mt-1 min-h-[32px]">{pkg.description}</p>
                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold text-[#252525]">
                      ${(pkg.price_cents / 100).toFixed(0)}
                    </span>
                    <span className="text-sm text-[#777777]">/ review</span>
                  </div>
                  <div className="mt-2 flex items-center gap-1.5 text-xs text-[#515151]">
                    <Clock className="h-3.5 w-3.5 text-[#5bbbae]" />
                    <span>{pkg.turn_around_hours}h Turnaround Delivery</span>
                  </div>
                </CardHeader>

                <CardContent className="flex-1 py-4">
                  <div className="border-t border-[#f0f2f4] pt-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-[#999999] mb-3">
                      What's Included
                    </p>
                    <ul className="space-y-2.5">
                      {pkg.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2.5 text-sm text-[#444444]">
                          <Check className="h-4 w-4 text-[#5bbbae] shrink-0 mt-0.5" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>

                <CardFooter className="pt-2 pb-6">
                  <Button
                    onClick={() => onSelectPackage(pkg)}
                    variant={isPro ? "default" : "outline"}
                    className={`w-full py-2.5 font-medium ${
                      isPro
                        ? "bg-[#5bbbae] hover:bg-[#497d76] text-white"
                        : "border-[#d1d6da] hover:border-[#5bbbae] hover:text-[#5bbbae]"
                    }`}
                  >
                    Select {pkg.name}
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
