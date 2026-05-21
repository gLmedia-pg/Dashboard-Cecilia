/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { parseISO, startOfDay, startOfWeek, startOfMonth, format, isValid } from 'date-fns';

export interface ClientData {
  fecha: Date;
  campana: string;
  formulario: string;
  captacion: string;
  cliente: string;
  celular: string;
  correo: string;
  contacto: string; // Contacto Laia
  asesora: string;
  distrito: string;
  contactoAsesor: string;
  leadPerdido: string;
}

export function parseDatabase(rawText: string): ClientData[] {
  const lines = rawText.trim().split('\n');
  const startIndex = lines[0].includes('FECHA') ? 1 : 0;
  
  return lines.slice(startIndex).map(line => {
    const parts = line.split(';');
    const fechaStr = parts[0] || '';
    const parsedDate = parseISO(fechaStr);
    
    let distrito = parts[7]?.trim() || 'sin distrito';
    if (distrito.toLowerCase() === 'sin distrito' || !distrito) {
      const correoVal = parts[6]?.trim() || '';
      const cities = ['Arequipa', 'Juliaca', 'Ayacucho', 'Puno', 'Cusco', 'Moquegua', 'Majes', 'Hunter', 'Cayma', 'Mollendo', 'Tacna', 'Ilo', 'Lima', 'Pedregal', 'Socabaya', 'Yanahuara', 'Miraflores', 'Uchumayo'];
      const foundCity = cities.find(city => correoVal.toLowerCase().includes(city.toLowerCase()));
      if (foundCity) distrito = foundCity;
    }

    return {
      fecha: isValid(parsedDate) ? parsedDate : new Date(),
      campana: parts[1] || 'Sin Campaña',
      formulario: parts[2] || 'Sin Formulario',
      captacion: parts[3] || 'Desconocido',
      cliente: parts[4] || 'Anónimo',
      celular: parts[5] || '',
      correo: parts[6] || '',
      contacto: parts[8]?.trim() || 'Sin Respuesta',
      asesora: parts[9]?.trim() || 'No Asignado',
      distrito,
      contactoAsesor: parts[10]?.trim() || 'Sin Seguimiento',
      leadPerdido: parts[11]?.trim() || 'Sin Calificar'
    };
  });
}

export function getStats(data: ClientData[]) {
  const stats = {
    total: data.length,
    byDay: [] as { name: string; value: number }[],
    byAdvisor: [] as { name: string; value: number }[],
    byResponse: [] as { name: string; value: number }[],
    byDistrito: [] as { name: string; value: number }[],
    byCampana: [] as { name: string; value: number }[],
    byCaptacion: [] as { name: string; value: number }[],
    byContactoAsesor: [] as { name: string; value: number }[],
    byLeadPerdido: [] as { name: string; value: number }[],
    withEmail: data.filter(d => d.correo && d.correo.includes('@')).length,
    withPhone: data.filter(d => d.celular && (d.celular.includes('+') || d.celular.length > 5)).length,
    byHour: [] as { name: string; value: number }[],
  };

  const dayMap: Record<string, number> = {};
  const hourMap: Record<string, number> = {};
  const advMap: Record<string, number> = {};
  const respMap: Record<string, number> = {};
  const distMap: Record<string, number> = {};
  const campMap: Record<string, number> = {};
  const captMap: Record<string, number> = {};
  const cAsesorMap: Record<string, number> = {};
  const lPerdidoMap: Record<string, number> = {};

  data.forEach(d => {
    const day = format(startOfDay(d.fecha), 'yyyy-MM-dd');
    dayMap[day] = (dayMap[day] || 0) + 1;

    const hour = format(d.fecha, 'HH:00');
    hourMap[hour] = (hourMap[hour] || 0) + 1;

    advMap[d.asesora || 'No Asignado'] = (advMap[d.asesora || 'No Asignado'] || 0) + 1;
    respMap[d.contacto || 'Pendiente'] = (respMap[d.contacto || 'Pendiente'] || 0) + 1;
    distMap[d.distrito || 'Sin Distrito'] = (distMap[d.distrito || 'Sin Distrito'] || 0) + 1;
    campMap[d.campana || 'Sin Campaña'] = (campMap[d.campana || 'Sin Campaña'] || 0) + 1;
    captMap[d.captacion || 'Sin Captación'] = (captMap[d.captacion || 'Sin Captación'] || 0) + 1;
    cAsesorMap[d.contactoAsesor || 'Sin Seguimiento'] = (cAsesorMap[d.contactoAsesor || 'Sin Seguimiento'] || 0) + 1;
    lPerdidoMap[d.leadPerdido || 'Sin Calificar'] = (lPerdidoMap[d.leadPerdido || 'Sin Calificar'] || 0) + 1;
  });

  stats.byDay = Object.entries(dayMap).map(([name, value]) => ({ name, value })).sort((a,b) => a.name.localeCompare(b.name));
  stats.byAdvisor = Object.entries(advMap).map(([name, value]) => ({ name, value }));
  stats.byResponse = Object.entries(respMap).map(([name, value]) => ({ name, value }));
  stats.byDistrito = Object.entries(distMap).map(([name, value]) => ({ name, value }));
  stats.byCampana = Object.entries(campMap).map(([name, value]) => ({ name, value }));
  stats.byCaptacion = Object.entries(captMap).map(([name, value]) => ({ name, value }));
  stats.byContactoAsesor = Object.entries(cAsesorMap).map(([name, value]) => ({ name, value }));
  stats.byLeadPerdido = Object.entries(lPerdidoMap).map(([name, value]) => ({ name, value }));
  stats.byHour = Object.entries(hourMap).map(([name, value]) => ({ name, value })).sort((a,b) => a.name.localeCompare(b.name));

  return stats;
}
