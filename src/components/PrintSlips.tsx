/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Voucher } from '../types';
import { Printer, X, FileSpreadsheet, Percent, Key, Wifi, Sparkles } from 'lucide-react';

interface PrintSlipsProps {
  vouchers: Voucher[];
  businessName: string;
  coverageArea: string;
  onClose: () => void;
}

export default function PrintSlips({ vouchers, businessName, coverageArea, onClose }: PrintSlipsProps) {
  const triggerPrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 overflow-y-auto p-4 md:p-8 flex items-center justify-center">
      <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden print:shadow-none print:rounded-none border border-slate-200">
        
        {/* Header toolbar - hidden when printing */}
        <div className="border-b border-slate-200 bg-slate-50 p-5 flex items-center justify-between print:hidden">
          <div>
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Printer className="text-brand-600 w-5 h-5 animate-pulse" /> Print Voucher slips ({vouchers.length} select items)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              These slips are designed to print cleanly on A4 paper, standard receipt rolls, or cards. Cut along the dotted guidelines.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={triggerPrint}
              className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl text-sm flex items-center gap-1.5 smooth-transition shadow-sm"
            >
              <Printer className="w-4 h-4" /> Trigger System Print
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg smooth-transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Print Layout */}
        <div className="p-8 max-h-[80vh] overflow-y-auto print:max-h-full print:overflow-hidden print:p-0 bg-slate-100 print:bg-white">
          
          <div className="text-center mb-6 print:hidden">
            <span className="text-[11px] bg-slate-200 text-slate-700 px-3 py-1.5 rounded-full font-medium">
              📄 PAGE SIMULATOR FOR CUT-OUT SHEETS
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-6 print:grid-cols-2 print:gap-4 print:text-black">
            {vouchers.map((voucher) => (
              <div
                key={voucher.id}
                className="bg-white border-2 border-dashed border-slate-300 rounded-xl p-5 relative overflow-hidden shadow-sm hover:shadow transition-all hover:border-brand-300 print:shadow-none print:border-black print:border-1"
              >
                {/* Micro cut indicators */}
                <div className="absolute top-0 left-1/2 -ml-2 -mt-1 w-4 h-2 bg-slate-100 border-b border-slate-300 rounded-full print:hidden" />
                <div className="absolute bottom-0 left-1/2 -ml-2 -mb-1 w-4 h-2 bg-slate-100 border-t border-slate-300 rounded-full print:hidden" />

                <div className="flex justify-between items-start border-b border-slate-100 pb-2 mb-3">
                  <div>
                    <h5 className="font-extrabold text-xs tracking-tight text-slate-800 uppercase print:text-black">
                      {businessName}
                    </h5>
                    <p className="text-[9px] text-slate-400 truncate max-w-[150px] print:text-black">
                      📡 {coverageArea || 'Campus Neighborhood Wi-Fi'}
                    </p>
                  </div>
                  <div className="bg-brand-50 text-brand-700 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider print:border print:border-black print:text-black print:bg-white">
                    ₦{voucher.planPrice}
                  </div>
                </div>

                {/* Subtitle Details */}
                <div className="space-y-1 mb-4">
                  <div className="flex justify-between text-[11px] text-slate-600 font-medium">
                    <span>Plan:</span>
                    <span className="font-extrabold text-slate-800 print:text-black">{voucher.planName}</span>
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-500">
                    <span>Quota Limit:</span>
                    <span className="font-semibold text-slate-800 print:text-black">
                      {voucher.dataLimitGb > 0 ? `${voucher.dataLimitGb} GB` : 'FUP Unlimited'}
                    </span>
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-500">
                    <span>Speed Cap:</span>
                    <span className="font-semibold text-slate-800 print:text-black">{voucher.speedLimitMbps} Mbps</span>
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-500">
                    <span>Validity:</span>
                    <span className="font-semibold text-slate-800 print:text-black">
                      {voucher.durationHours >= 168 ? `${voucher.durationHours / 168} Week(s)` : `${voucher.durationHours} Hour(s)`}
                    </span>
                  </div>
                </div>

                {/* Voucher Highlighted Code */}
                <div className="bg-slate-50 border border-slate-200/80 rounded-lg p-3 text-center mb-3 group transition-colors hover:bg-slate-100 print:bg-white print:border-black">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest block mb-0.5">
                    VOUCHER CODE
                  </span>
                  <p className="text-base font-extrabold text-slate-900 tracking-wider font-mono select-all">
                    {voucher.code}
                  </p>
                </div>

                {/* Printable footer manual instructions */}
                <div className="border-t border-slate-100 pt-2 text-[9px] text-slate-400 leading-normal space-y-1 print:text-black">
                  <p className="font-semibold text-[9.5px] text-slate-600 print:text-black">How to Connect:</p>
                  <ol className="list-decimal list-inside space-y-0.5 text-left pl-1">
                    <li>Enable Wi-Fi, search and connect to <strong className="font-semibold">{businessName}</strong></li>
                    <li>Wait for the Portal page to slide down automatically</li>
                    <li>Input the 12-character Code above, tap "ACTIVATE"!</li>
                  </ol>
                  <div className="text-center pt-1.5 text-[8px] text-brand-600 uppercase font-bold tracking-widest print:hidden">
                    ★ Premium Starlink Speed ★
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>

      </div>
    </div>
  );
}
