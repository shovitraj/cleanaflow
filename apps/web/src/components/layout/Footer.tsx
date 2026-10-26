import Link from "next/link";
import { Sparkles } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="col-span-1 md:col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-teal-500 flex items-center justify-center text-white">
              <Sparkles className="w-4 h-4" />
            </div>
            <span className="text-lg font-bold text-white">CleanAglow</span>
          </div>
          <p className="text-sm text-slate-400 max-w-sm mb-4">
            The subscription-first home cleaning marketplace connecting trusted local cleaning professionals with homeowners.
          </p>
          <p className="text-xs text-slate-500">
            © {new Date().getFullYear()} CleanAglow, Inc. All rights reserved.
          </p>
        </div>

        <div>
          <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider mb-3">
            For Customers
          </h4>
          <ul className="space-y-2 text-sm">
            <li><Link href="/book" className="hover:text-white transition">Book a Cleaning</Link></li>
            <li><Link href="/login" className="hover:text-white transition">Customer Sign In</Link></li>
            <li><Link href="/dashboard" className="hover:text-white transition">My Dashboard</Link></li>
            <li><Link href="/pricing" className="hover:text-white transition">Subscription Plans</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider mb-3">
            For Cleaners
          </h4>
          <ul className="space-y-2 text-sm">
            <li><Link href="/register?role=CLEANER" className="hover:text-white transition">Apply as Cleaner</Link></li>
            <li><Link href="/pro/jobs" className="hover:text-white transition">Job Feed</Link></li>
            <li><Link href="/pro/earnings" className="hover:text-white transition">Payouts & Stripe</Link></li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
