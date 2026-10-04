import Link from "next/link";
import { ArrowLeft, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-slate-900 text-white px-4 py-16">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="space-y-2">
          <span className="text-6xl font-black text-[#5bbbae]">404</span>
          <h1 className="text-2xl font-bold tracking-tight">Page Not Found</h1>
          <p className="text-sm text-slate-400">
            The candidate profile, article, or resource you are looking for does not exist or has been moved.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
          <Link href="/">
            <Button variant="default" className="w-full sm:w-auto bg-[#5bbbae] hover:bg-[#497d76] text-white gap-2">
              <ArrowLeft className="w-4 h-4" /> Back to Home
            </Button>
          </Link>
          <Link href="/search">
            <Button variant="outline" className="w-full sm:w-auto border-slate-700 text-white hover:bg-slate-800 gap-2">
              <Search className="w-4 h-4" /> Browse Candidates
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
