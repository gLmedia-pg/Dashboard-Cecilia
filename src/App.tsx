/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import Dashboard from './Dashboard';
import { RAW_DATABASE } from './data/rawDb';
import { Upload, FileSpreadsheet, BarChart3, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [data, setData] = useState<string>(RAW_DATABASE);
  const [view, setView] = useState<'upload' | 'dashboard'>('dashboard');

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        setData(text);
        setView('dashboard');
      };
      reader.readAsText(file);
    }
  };

  return (
    <AnimatePresence mode="wait">
      {view === 'dashboard' ? (
        <motion.div
          key="dashboard"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="relative"
        >
          <Dashboard rawData={data} />
          
          {/* Floating toggle to upload new data */}
          <button 
            onClick={() => setView('upload')}
            className="fixed bottom-6 right-6 p-4 bg-slate-900 text-white rounded-full shadow-xl hover:scale-110 transition-transform flex items-center gap-2 group"
          >
            <Upload size={20} />
            <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 font-medium whitespace-nowrap">
              Nueva Data
            </span>
          </button>
        </motion.div>
      ) : (
        <motion.div
          key="upload"
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.02 }}
          className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans"
        >
          <div className="max-w-md w-full bg-white p-10 rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-200 text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-blue-600"></div>
            
            <div className="w-20 h-20 bg-slate-900 text-white rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-lg shadow-blue-500/20">
              <FileSpreadsheet size={40} />
            </div>
            
            <h2 className="text-2xl font-black text-slate-900 mb-3 tracking-tight">STATISTICA <span className="text-blue-600">PRO</span></h2>
            <p className="text-slate-500 mb-10 text-sm font-medium leading-relaxed">
              Analiza tu base de datos de clientes con IA. Sube tu archivo CSV o Excel para obtener métricas instantáneas.
            </p>

            <div className="space-y-4">
              <label className="block group">
                <div className="relative border-2 border-dashed border-slate-200 rounded-3xl p-10 group-hover:border-blue-500 group-hover:bg-blue-50/30 transition-all cursor-pointer">
                  <input 
                    type="file" 
                    accept=".csv,.txt" 
                    className="hidden" 
                    onChange={handleFileUpload}
                  />
                  <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                    <Upload size={24} />
                  </div>
                  <p className="text-sm font-bold text-slate-700">Seleccionar archivo</p>
                  <p className="text-[10px] text-slate-400 mt-1 font-bold uppercase tracking-widest">CSV (Punto y coma)</p>
                </div>
              </label>

              <button 
                onClick={() => setView('dashboard')}
                className="w-full py-4 px-6 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all flex items-center justify-center gap-2 shadow-lg shadow-slate-900/10 active:scale-[0.98]"
              >
                <BarChart3 size={18} /> Explorar Demo
              </button>
            </div>

            <div className="mt-10 flex items-start gap-3 p-4 bg-slate-50 rounded-2xl text-left border border-slate-100">
              <div className="w-6 h-6 bg-amber-100 text-amber-600 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                <AlertCircle size={14} />
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed font-semibold">
                <span className="text-slate-900 block mb-0.5">Requisito de Formato:</span>
                Asegúrate de que las columnas estén separadas por punto y coma (;) como en las exportaciones de Facebook Ads.
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
