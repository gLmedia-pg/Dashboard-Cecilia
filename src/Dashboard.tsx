/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend, AreaChart, Area
} from 'recharts';
import { 
  Users, Calendar, CheckCircle2, UserCheck, MapPin, 
  TrendingUp, Mail, Phone, Download, Filter, LayoutDashboard,
  Target, UserMinus, Flame, Globe, MessageSquare, CheckSquare
} from 'lucide-react';
import { motion } from 'motion/react';
import { parseDatabase, getStats } from './utils/dataParser';
import { format, isToday, isThisWeek, isThisMonth, getYear, isEqual, parseISO, isYesterday, subDays, startOfMonth, endOfMonth, isWithinInterval, subWeeks, subMonths, startOfWeek, endOfWeek, isSameDay } from 'date-fns';

const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4'];

const StatCard = ({ title, value, subValue, icon: Icon, color, trend }: any) => (
  <motion.div 
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between"
  >
    <div className="flex justify-between items-start">
      <div className={`p-2 rounded-lg ${color} bg-opacity-10`}>
        <Icon size={18} className={color.split(' ')[0]} />
      </div>
      {trend && (
        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${trend > 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
          {trend > 0 ? '+' : ''}{trend}%
        </span>
      )}
    </div>
    <div className="mt-3">
      <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">{title}</p>
      <div className="flex items-baseline gap-2">
        <h3 className="text-xl font-black text-slate-900">{value}</h3>
        {subValue && <span className="text-[10px] text-slate-400 font-medium">{subValue}</span>}
      </div>
    </div>
  </motion.div>
);

export default function Dashboard({ rawData }: { rawData: string }) {
  const [filterAdvisor, setFilterAdvisor] = useState('Todos');
  const [filterResponse, setFilterResponse] = useState('Todos');
  const [filterCampaign, setFilterCampaign] = useState('Todos');
  const [timeRange, setTimeRange] = useState('Total');
  const [selectedYear, setSelectedYear] = useState('Todos');
  const [compareYear, setCompareYear] = useState('Ninguno');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const data = useMemo(() => parseDatabase(rawData), [rawData]);
  const advisors = useMemo(() => ['Todos', ...Array.from(new Set(data.map(d => d.asesora))).filter(Boolean)], [data]);
  const responses = useMemo(() => ['Todos', ...Array.from(new Set(data.map(d => d.contacto))).filter(Boolean)], [data]);
  const campaigns = useMemo(() => ['Todos', ...Array.from(new Set(data.map(d => d.campana))).filter(Boolean)], [data]);
  const years = useMemo(() => ['Todos', ...Array.from(new Set(data.map(d => getYear(d.fecha).toString())))].sort(), [data]);

  const applyTimeFilters = (dataset: any[], range: string, year: string, start?: string, end?: string) => {
    return dataset.filter(d => {
      const yearMatch = year === 'Todos' || getYear(d.fecha).toString() === year;
      if (!yearMatch) return false;

      if (range === 'Custom' && start && end) {
        return isWithinInterval(d.fecha, { start: parseISO(start), end: parseISO(end) });
      }

      const dateMatch = 
        range === 'Total' ? true :
        range === 'Hoy' ? isToday(d.fecha) :
        range === 'Ayer' ? isYesterday(d.fecha) :
        range === 'Semana' ? isThisWeek(d.fecha) :
        range === 'Mes' ? isThisMonth(d.fecha) : true;
      
      return dateMatch;
    });
  };

  const filteredData = useMemo(() => {
    let base = applyTimeFilters(data, timeRange, selectedYear, startDate, endDate);
    return base.filter(d => {
      const matchAdv = filterAdvisor === 'Todos' || d.asesora === filterAdvisor;
      const matchResp = filterResponse === 'Todos' || (d.contacto || 'Sin Respuesta') === filterResponse;
      const matchCamp = filterCampaign === 'Todos' || d.campana === filterCampaign;
      return matchAdv && matchResp && matchCamp;
    });
  }, [data, filterAdvisor, filterResponse, filterCampaign, timeRange, selectedYear, startDate, endDate]);

  const stats = useMemo(() => getStats(filteredData), [filteredData]);

  // Comparison logic for cards (Comparison vs previous period)
  const previousPeriodStats = useMemo(() => {
    if (selectedYear !== 'Todos' && compareYear !== 'Ninguno') return null; // Year comparison takes priority if active

    const getPrevDataset = () => {
      if (timeRange === 'Hoy') {
        return data.filter(d => isYesterday(d.fecha));
      } else if (timeRange === 'Ayer') {
        const anteayer = subDays(new Date(), 2);
        return data.filter(d => isSameDay(d.fecha, anteayer));
      } else if (timeRange === 'Semana') {
        const lastWeekStart = startOfWeek(subWeeks(new Date(), 1));
        const lastWeekEnd = endOfWeek(subWeeks(new Date(), 1));
        return data.filter(d => isWithinInterval(d.fecha, { start: lastWeekStart, end: lastWeekEnd }));
      } else if (timeRange === 'Mes') {
        const lastMonthStart = startOfMonth(subMonths(new Date(), 1));
        const lastMonthEnd = endOfMonth(subMonths(new Date(), 1));
        return data.filter(d => isWithinInterval(d.fecha, { start: lastMonthStart, end: lastMonthEnd }));
      }
      return [];
    };

    const basePrev = getPrevDataset();
    const filteredPrev = basePrev.filter(d => {
      const matchAdv = filterAdvisor === 'Todos' || d.asesora === filterAdvisor;
      const matchResp = filterResponse === 'Todos' || (d.contacto || 'Sin Respuesta') === filterResponse;
      const matchCamp = filterCampaign === 'Todos' || d.campana === filterCampaign;
      return matchAdv && matchResp && matchCamp;
    });

    return filteredPrev.length > 0 ? getStats(filteredPrev) : null;
  }, [data, timeRange, filterAdvisor, filterResponse, filterCampaign, selectedYear, compareYear]);

  const trendData = useMemo(() => {
    // If year comparison is active, keep that logic
    if (selectedYear !== 'Todos' && compareYear !== 'Ninguno') {
      const currentYearMap: Record<string, number> = {};
      filteredData.forEach(d => {
        const md = format(d.fecha, 'MM-dd');
        currentYearMap[md] = (currentYearMap[md] || 0) + 1;
      });

      const compareYearMap: Record<string, number> = {};
      let compareBase = applyTimeFilters(data, timeRange, compareYear, startDate, endDate);
      compareBase.filter(d => {
        const matchAdv = filterAdvisor === 'Todos' || d.asesora === filterAdvisor;
        const matchResp = filterResponse === 'Todos' || (d.contacto || 'Sin Respuesta') === filterResponse;
        const matchCamp = filterCampaign === 'Todos' || d.campana === filterCampaign;
        return matchAdv && matchResp && matchCamp;
      }).forEach(d => {
        const md = format(d.fecha, 'MM-dd');
        compareYearMap[md] = (compareYearMap[md] || 0) + 1;
      });

      const allKeys = Array.from(new Set([...Object.keys(currentYearMap), ...Object.keys(compareYearMap)])).sort();
      
      return allKeys.map(k => ({
        name: k,
        displayDate: k.split('-').reverse().join('/'),
        value: currentYearMap[k] || 0,
        compareValue: compareYearMap[k] || 0
      }));
    }

    // Default trend view (byDay)
    if (timeRange === 'Total' || timeRange === 'Semana' || timeRange === 'Mes' || timeRange === 'Custom') {
      return stats.byDay.map(d => ({
        ...d,
        displayDate: format(parseISO(d.name), 'dd/MM')
      }));
    }

    // Hourly versus for Today/Yesterday
    if (timeRange === 'Hoy' || timeRange === 'Ayer') {
      const currentDayStats = stats.byHour;
      const prevDayDataset = timeRange === 'Hoy' 
        ? data.filter(d => isYesterday(d.fecha))
        : data.filter(d => isSameDay(d.fecha, subDays(new Date(), 2)));
      
      const filteredPrev = prevDayDataset.filter(d => {
        const matchAdv = filterAdvisor === 'Todos' || d.asesora === filterAdvisor;
        const matchResp = filterResponse === 'Todos' || (d.contacto || 'Sin Respuesta') === filterResponse;
        const matchCamp = filterCampaign === 'Todos' || d.campana === filterCampaign;
        return matchAdv && matchResp && matchCamp;
      });
      const prevDayStats = getStats(filteredPrev).byHour;

      const hourKeys = Array.from(new Set([...currentDayStats.map(s => s.name), ...prevDayStats.map(s => s.name)])).sort();
      return hourKeys.map(h => ({
        name: h,
        displayDate: h,
        value: currentDayStats.find(s => s.name === h)?.value || 0,
        compareValue: prevDayStats.find(s => s.name === h)?.value || 0
      }));
    }

    return stats.byDay.map(d => ({
      ...d,
      displayDate: format(parseISO(d.name), 'dd/MM')
    }));
  }, [filteredData, data, compareYear, selectedYear, timeRange, filterAdvisor, filterResponse, filterCampaign, stats.byDay, stats.byHour, startDate, endDate]);

  // Comparison stats for trends
  const compareData = useMemo(() => {
    if (compareYear === 'Ninguno' || selectedYear === 'Todos') return null;
    let base = applyTimeFilters(data, timeRange, compareYear, startDate, endDate);
    const filteredCompare = base.filter(d => {
      const matchAdv = filterAdvisor === 'Todos' || d.asesora === filterAdvisor;
      const matchResp = filterResponse === 'Todos' || (d.contacto || 'Sin Respuesta') === filterResponse;
      const matchCamp = filterCampaign === 'Todos' || d.campana === filterCampaign;
      return matchAdv && matchResp && matchCamp;
    });
    return getStats(filteredCompare);
  }, [data, filterAdvisor, filterResponse, filterCampaign, timeRange, compareYear, selectedYear, startDate, endDate]);

  const calculationTrend = (current: number, previous: number) => {
    if (!previous) return 0;
    return Math.round(((current - previous) / previous) * 100);
  };

  const leadsWithoutAdvisor = useMemo(() => filteredData.filter(d => 
    d.asesora.toLowerCase().includes('sin asesor') || d.asesora.toLowerCase().includes('no asignado')
  ).length, [filteredData]);

  const leadsWithoutDistrito = useMemo(() => filteredData.filter(d => 
    d.distrito.toLowerCase().includes('sin distrito')
  ).length, [filteredData]);

  const leadsPerdidosDataset = useMemo(() => filteredData.filter(d => 
    d.leadPerdido.toLowerCase().includes('perdido')
  ), [filteredData]);

  const exportToCSV = (dataset: any[], filename: string) => {
    if (!dataset.length) return;
    const headers = ["FECHA", "CAMPAÑA", "FORMULARIO", "CAPTACIÓN", "CLIENTE", "CELULAR", "CORREO", "DISTRITO", "CONTACTO LAIA", "ASESORA", "CONTACTO ASESOR", "ESTADO CUALIFICACION"];
    const csvContent = dataset.map(d => [
      format(d.fecha, 'yyyy-MM-dd HH:mm:ss'),
      d.campana,
      d.formulario,
      d.captacion,
      d.cliente,
      d.celular,
      d.correo,
      d.distrito,
      d.contacto,
      d.asesora,
      d.contactoAsesor,
      d.leadPerdido
    ].map(v => `"${(v || '').toString().replace(/"/g, '""')}"`).join(";")).join("\n");
    
    const blob = new Blob([headers.join(";") + "\n" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `${filename}_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const conversionRate = useMemo(() => {
    const siCount = stats.byResponse.find(r => r.name.toLowerCase().includes('si'))?.value || 0;
    return stats.total ? Math.round((siCount / stats.total) * 100) : 0;
  }, [stats]);

  const mostEffectiveCampaign = useMemo(() => {
    if (!filteredData.length) return 'N/A';
    const campStats: Record<string, { total: number, si: number }> = {};
    filteredData.forEach(d => {
      if (!campStats[d.campana]) campStats[d.campana] = { total: 0, si: 0 };
      campStats[d.campana].total++;
      if (d.contacto.toLowerCase().includes('si')) campStats[d.campana].si++;
    });
    const winner = Object.entries(campStats).sort((a, b) => b[1].si - a[1].si)[0];
    return winner ? winner[0] : 'N/A';
  }, [filteredData]);

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col shrink-0">
        <div className="p-6 flex items-center gap-3 border-b border-slate-800">
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
            <LayoutDashboard size={20} className="text-white" />
          </div>
          <span className="font-bold text-lg tracking-tight">STATISTICA <span className="text-blue-400 font-black">PRO</span></span>
        </div>
        
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 px-2">Análisis Principal</div>
          <button className="w-full flex items-center gap-3 px-3 py-2 bg-blue-600 rounded-lg text-sm font-medium transition-colors">
            <TrendingUp size={18} /> Resumen General
          </button>
          
          <div className="pt-6 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 px-2">Filtros Avanzados</div>
          <div className="space-y-4 px-2">
            <div className="space-y-1">
              <label className="text-[10px] text-slate-400 uppercase font-bold">Año Principal</label>
              <select 
                value={selectedYear} 
                onChange={e => setSelectedYear(e.target.value)} 
                className="w-full bg-slate-800 border-none rounded-lg text-xs p-2 outline-none focus:ring-1 focus:ring-blue-500"
              >
                {years.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            {selectedYear !== 'Todos' && (
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 uppercase font-bold">Comparar con Año</label>
                <select 
                  value={compareYear} 
                  onChange={e => setCompareYear(e.target.value)} 
                  className="w-full bg-slate-800 border-none rounded-lg text-xs p-2 outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="Ninguno">Ninguno</option>
                  {years.filter(y => y !== selectedYear && y !== 'Todos').map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
            )}
            <div className="space-y-1">
              <label className="text-[10px] text-slate-400 uppercase font-bold">Filtro por Mes</label>
              <select 
                onChange={e => {
                  if (e.target.value === 'none') {
                    setTimeRange('Total');
                    return;
                  }
                  const month = parseInt(e.target.value);
                  const year = selectedYear === 'Todos' ? getYear(new Date()) : parseInt(selectedYear);
                  const start = format(startOfMonth(new Date(year, month)), 'yyyy-MM-dd');
                  const end = format(endOfMonth(new Date(year, month)), 'yyyy-MM-dd');
                  setStartDate(start);
                  setEndDate(end);
                  setTimeRange('Custom');
                }}
                className="w-full bg-slate-800 border-none rounded-lg text-xs p-2 outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="none">Todos</option>
                {['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'].map((m, i) => (
                  <option key={m} value={i}>{m}</option>
                ))}
              </select>
            </div>
            <div className="h-px bg-slate-800 my-2"></div>
            <div className="space-y-1">
              <label className="text-[10px] text-slate-400 uppercase font-bold">Campaña</label>
              <select 
                value={filterCampaign} 
                onChange={e => setFilterCampaign(e.target.value)} 
                className="w-full bg-slate-800 border-none rounded-lg text-xs p-2 outline-none focus:ring-1 focus:ring-blue-500"
              >
                {campaigns.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-slate-400 uppercase font-bold">Asesor</label>
              <select 
                value={filterAdvisor} 
                onChange={e => setFilterAdvisor(e.target.value)} 
                className="w-full bg-slate-800 border-none rounded-lg text-xs p-2 outline-none focus:ring-1 focus:ring-blue-500"
              >
                {advisors.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-slate-400 uppercase font-bold">Contacto</label>
              <select 
                value={filterResponse} 
                onChange={e => setFilterResponse(e.target.value)} 
                className="w-full bg-slate-800 border-none rounded-lg text-xs p-2 outline-none focus:ring-1 focus:ring-blue-500"
              >
                {responses.map(r => <option key={r} value={r || 'Sin Respuesta'}>{r || 'Sin Respuesta'}</option>)}
              </select>
            </div>
          </div>
        </nav>

        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-3 px-3 py-2 bg-slate-800/50 rounded-lg">
            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-xs font-bold">AZ</div>
            <div className="text-xs">
              <div className="font-medium text-slate-200">Admin User</div>
              <div className="text-slate-500 text-[10px]">Plan Premium</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0 sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-black text-slate-800 tracking-tight">DASHBOARD</h1>
            <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-bold rounded-full uppercase">
              {selectedYear === 'Todos' ? 'Histórico Total' : `Año ${selectedYear}`}
              {compareYear !== 'Ninguno' && ` vs ${compareYear}`}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex bg-slate-100 rounded-lg p-1">
              {['Hoy', 'Ayer', 'Semana', 'Mes', 'Total'].map(range => (
                <button 
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                    timeRange === range ? 'bg-white shadow-sm text-slate-900 border border-slate-200' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {range}
                </button>
              ))}
            </div>
            
            <div className="flex items-center gap-2 bg-slate-100 rounded-lg p-1">
              <div className="flex items-center gap-1 px-2 border-r border-slate-200">
                <Calendar size={14} className="text-slate-400" />
                <span className="text-[10px] font-bold text-slate-500 uppercase">Periodo</span>
              </div>
              <input 
                type="date" 
                value={startDate} 
                onChange={e => {
                  setStartDate(e.target.value);
                  setTimeRange('Custom');
                }}
                className="bg-transparent border-none text-[10px] font-bold outline-none cursor-pointer p-0 w-24"
              />
              <span className="text-slate-300">-</span>
              <input 
                type="date" 
                value={endDate} 
                onChange={e => {
                  setEndDate(e.target.value);
                  setTimeRange('Custom');
                }}
                className="bg-transparent border-none text-[10px] font-bold outline-none cursor-pointer p-0 w-24"
              />
            </div>

            <div className="h-8 w-px bg-slate-200"></div>
            <button 
              onClick={() => exportToCSV(filteredData, 'leads_pro_maestro')}
              className="flex items-center gap-2 text-sm font-bold text-blue-600 hover:text-blue-700"
            >
              <Download size={16} /> <span className="hidden sm:inline">Exportar Todo</span>
            </button>
          </div>
        </header>

        <div className="p-6 space-y-6">
          {/* KPI Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            <StatCard 
              title="Total Clientes" 
              value={stats.total} 
              icon={Users} 
              color="text-violet-600 bg-violet-600"
              trend={compareData ? calculationTrend(stats.total, compareData.total) : (previousPeriodStats ? calculationTrend(stats.total, previousPeriodStats.total) : null)}
            />
            <StatCard 
              title="Tasa Conversión" 
              value={`${conversionRate}%`} 
              subValue="del total"
              icon={Target} 
              color="text-emerald-600 bg-emerald-600"
              trend={compareData ? calculationTrend(conversionRate, (Math.round(((compareData.byResponse.find(r => r.name.toLowerCase().includes('si'))?.value || 0) / (compareData.total || 1)) * 100))) : (previousPeriodStats ? calculationTrend(conversionRate, (Math.round(((previousPeriodStats.byResponse.find(r => r.name.toLowerCase().includes('si'))?.value || 0) / (previousPeriodStats.total || 1)) * 100))) : null)}
            />
            <StatCard 
              title="Sin Asesor" 
              value={leadsWithoutAdvisor} 
              subValue="Leads libres"
              icon={UserMinus} 
              color="text-rose-600 bg-rose-600"
            />
            <StatCard 
              title="Contacto Asesor" 
              value={stats.byContactoAsesor.filter(r => !r.name.toLowerCase().includes('sin')).reduce((acc, curr) => acc + curr.value, 0)} 
              subValue="Con seguimiento"
              icon={MessageSquare} 
              color="text-indigo-600 bg-indigo-600"
            />
            <StatCard 
              title="Cualificados" 
              value={stats.byLeadPerdido.filter(r => r.name.toLowerCase().includes('si') || r.name.toLowerCase().includes('calificado')).reduce((acc, curr) => acc + curr.value, 0)} 
              subValue="Ventas potenciales"
              icon={CheckSquare} 
              color="text-amber-600 bg-amber-600"
            />
            <StatCard 
              title="Leads Perdidos" 
              value={leadsPerdidosDataset.length} 
              subValue="Remarketing"
              icon={UserMinus} 
              color="text-red-700 bg-red-700"
            />
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between border-dashed border-red-200">
               <div className="flex justify-between items-start">
                 <div className="p-2 rounded-lg text-red-600 bg-red-50">
                    <Download size={18} />
                 </div>
               </div>
               <div className="mt-2">
                 <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider line-clamp-1">Base Remarketing</p>
                 <button 
                  onClick={() => exportToCSV(leadsPerdidosDataset, 'remarketing_leads_perdidos')}
                  disabled={leadsPerdidosDataset.length === 0}
                  className="w-full mt-1 bg-red-600 hover:bg-red-700 disabled:bg-slate-300 text-white text-[10px] font-black py-1.5 rounded uppercase transition-colors shadow-sm"
                 >
                   Exportar CSV
                 </button>
               </div>
            </div>
            <StatCard 
              title="Mejor Campaña" 
              value={mostEffectiveCampaign.split(' - ')[0]} 
              subValue="Top Conversión"
              icon={Flame} 
              color="text-orange-600 bg-orange-600"
            />
          </div>

          {/* Secondary KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
              <p className="text-slate-500 text-[10px] font-bold uppercase mb-1">Con Correo Electrónico</p>
              <div className="flex items-center gap-3">
                <span className="text-xl font-bold">{stats.withEmail}</span>
                <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500" style={{ width: `${(stats.withEmail / (stats.total || 1)) * 100}%` }}></div>
                </div>
                <span className="text-[10px] font-bold text-slate-400">{Math.round((stats.withEmail/(stats.total || 1))*100)}%</span>
              </div>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
              <p className="text-slate-500 text-[10px] font-bold uppercase mb-1">Con Celular Validado</p>
              <div className="flex items-center gap-3">
                <span className="text-xl font-bold">{stats.withPhone}</span>
                <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500" style={{ width: `${(stats.withPhone / (stats.total || 1)) * 100}%` }}></div>
                </div>
                <span className="text-[10px] font-bold text-slate-400">{Math.round((stats.withPhone/(stats.total || 1))*100)}%</span>
              </div>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
              <p className="text-slate-500 text-[10px] font-bold uppercase mb-1">Sin Contacto Laia</p>
              <div className="flex items-center gap-3">
                <span className="text-xl font-bold">{stats.byResponse.find(r => r.name.toLowerCase().includes('sin contacto'))?.value || 0}</span>
                <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500" style={{ width: `${((stats.byResponse.find(r => r.name.toLowerCase().includes('sin contacto'))?.value || 0) / (stats.total || 1)) * 100}%` }}></div>
                </div>
                <span className="text-[10px] font-bold text-slate-400">{Math.round(((stats.byResponse.find(r => r.name.toLowerCase().includes('sin contacto'))?.value || 0)/(stats.total || 1))*100)}%</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col h-[350px]">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="font-black text-slate-800 text-sm italic">TENDENCIA TEMPORAL</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Volumen de leads por día</p>
                </div>
                <div className="flex gap-4 text-[10px] uppercase font-bold">
                  <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-blue-500"></div> {selectedYear === 'Todos' ? 'Leads' : selectedYear}</span>
                  {compareData && (
                    <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-slate-300"></div> Comparativa {compareYear}</span>
                  )}
                </div>
              </div>
              <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData}>
                    <defs>
                      <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorCompare" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#94a3b8" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="displayDate" fontSize={10} axisLine={false} tickLine={false} tick={{fill: '#94a3b8'}} />
                    <YAxis fontSize={10} axisLine={false} tickLine={false} tick={{fill: '#94a3b8'}} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      labelFormatter={(label) => `Fecha: ${label}`}
                    />
                    <Area type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorValue)" name={selectedYear === 'Todos' ? 'Leads' : selectedYear} />
                    {(compareData || timeRange === 'Hoy' || timeRange === 'Ayer') && (
                      <Area type="monotone" dataKey="compareValue" stroke="#94a3b8" strokeWidth={2} strokeDasharray="5 5" fillOpacity={1} fill="url(#colorCompare)" name={compareYear !== 'Ninguno' ? compareYear : (timeRange === 'Hoy' ? 'Ayer' : 'Anteayer')} />
                    )}
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col h-[350px]">
              <h3 className="font-black text-slate-800 mb-6 text-sm italic uppercase">Distribución Campañas</h3>
              <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie 
                      data={stats.byCampana} 
                      innerRadius={60} 
                      outerRadius={80} 
                      paddingAngle={5} 
                      dataKey="value"
                      stroke="none"
                    >
                      {stats.byCampana.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                    <Legend 
                      verticalAlign="bottom" 
                      align="center"
                      iconType="circle" 
                      wrapperStyle={{ fontSize: '9px', paddingTop: '10px', fontWeight: 'bold', textTransform: 'uppercase' }} 
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col h-[350px]">
              <h3 className="font-black text-slate-800 mb-6 text-sm italic uppercase text-center">Fuentes Captación</h3>
              <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.byCaptacion} layout="vertical">
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" fontSize={10} width={80} axisLine={false} tickLine={false} />
                    <Tooltip />
                    <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col h-[350px]">
              <h3 className="font-black text-slate-800 mb-6 text-sm italic uppercase">Rendimiento Asesores</h3>
              <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie 
                      data={stats.byAdvisor} 
                      innerRadius={60} 
                      outerRadius={80} 
                      paddingAngle={5} 
                      dataKey="value"
                      stroke="none"
                    >
                      {stats.byAdvisor.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                    <Legend 
                      verticalAlign="bottom" 
                      align="center"
                      iconType="circle" 
                      wrapperStyle={{ fontSize: '10px', paddingTop: '10px', fontWeight: 'bold', textTransform: 'uppercase' }} 
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col h-[350px]">
              <h3 className="font-black text-slate-800 mb-6 text-sm italic uppercase text-center">Estado Asesor</h3>
              <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.byContactoAsesor} layout="vertical">
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" fontSize={10} width={100} axisLine={false} tickLine={false} />
                    <Tooltip />
                    <Bar dataKey="value" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col h-[350px]">
               <h3 className="font-black text-slate-800 mb-4 text-sm italic uppercase">Top Geográfico</h3>
               <div className="space-y-4 overflow-y-auto pr-2">
                 {stats.byDistrito.slice(0, 10).sort((a,b) => b.value - a.value).map((d, i) => (
                   <div key={i} className="space-y-1.5">
                     <div className="flex justify-between items-center text-[10px]">
                        <span className="text-slate-500 font-bold uppercase truncate">{d.name}</span>
                        <span className="font-black text-slate-900">{d.value}</span>
                     </div>
                     <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-slate-900 rounded-full" style={{ width: `${(d.value / Math.max(...stats.byDistrito.map(x => x.value || 1))) * 100}%` }}></div>
                     </div>
                   </div>
                 ))}
               </div>
            </div>

            <div className="lg:col-span-3 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-[400px]">
              <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <div>
                  <h3 className="font-black text-slate-800 text-sm italic uppercase">Registro Maestro de Clientes</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Últimos 30 días de actividad</p>
                </div>
                <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">{filteredData.filter(d => isWithinInterval(d.fecha, { start: subDays(new Date(), 30), end: new Date() })).length} registros</span>
              </div>
              <div className="overflow-x-auto flex-1">
                <table className="w-full text-xs">
                  <thead className="text-slate-400 uppercase tracking-tight font-bold border-b border-slate-50 sticky top-0 bg-white">
                    <tr>
                      <th className="p-4 text-left font-bold">Cliente</th>
                      <th className="p-4 text-left font-bold">Campaña</th>
                      <th className="p-4 text-left font-bold">Asesor</th>
                      <th className="p-4 text-left font-bold" title="Contacto Laia">Laia</th>
                      <th className="p-4 text-left font-bold" title="Contacto Asesor">Asesor</th>
                      <th className="p-4 text-left font-bold" title="Lead Perdido">Cualific.</th>
                      <th className="p-4 text-right font-bold">Fecha</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filteredData
                      .filter(d => isWithinInterval(d.fecha, { start: subDays(new Date(), 30), end: new Date() }))
                      .sort((a, b) => b.fecha.getTime() - a.fecha.getTime())
                      .map((d, i) => (
                      <tr key={i} className="group hover:bg-slate-50 transition-colors">
                        <td className="p-4 font-bold text-slate-700">{d.cliente}</td>
                        <td className="p-4 text-slate-500 font-medium truncate max-w-[120px]">{d.campana}</td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded-full font-semibold ${d.asesora.toLowerCase().includes('sin') ? 'bg-rose-50 text-rose-500' : 'bg-slate-100 text-slate-600'}`}>
                            {d.asesora}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded-full font-bold ${
                            d.contacto.toLowerCase().includes('si') 
                              ? 'bg-emerald-50 text-emerald-600' 
                              : d.contacto.toLowerCase().includes('no') 
                                ? 'bg-rose-50 text-rose-600'
                                : 'bg-slate-100 text-slate-500'
                          }`}>
                            {d.contacto || 'Pendiente'}
                          </span>
                        </td>
                        <td className="p-4 font-medium text-slate-500">{d.contactoAsesor}</td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded-full font-bold ${
                            d.leadPerdido.toLowerCase().includes('perdido') 
                              ? 'bg-rose-50 text-rose-600' 
                              : d.leadPerdido.toLowerCase().includes('calificado')
                                ? 'bg-emerald-50 text-emerald-600'
                                : 'bg-slate-100 text-slate-500'
                          }`}>
                            {d.leadPerdido}
                          </span>
                        </td>
                        <td className="p-4 text-right text-slate-400 font-medium">{format(d.fecha, 'dd/MM HH:mm')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
