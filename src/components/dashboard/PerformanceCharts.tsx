"use client";


import { motion } from 'framer-motion';
import { Card } from "@/components/ui/Card";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';

interface Props {
  chartData: any[];
  radarData: any[];
}

export default function PerformanceCharts({ chartData, radarData }: Props) {
  return (
    <>
      <motion.div initial={{opacity: 0, y: 20}} animate={{opacity: 1, y: 0}} transition={{delay: 0.4}} className="md:col-span-3 pb-8">
        <Card interactive={false} className="border-border bg-surface/30 p-6 h-[400px]">
           <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-4 block">Performance Latency Matrix</span>
           <div className="w-full h-full pb-8">
             <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="name" stroke="#666" tick={{fontSize: 10, fill: '#666'}} />
                  <YAxis stroke="#666" tick={{fontSize: 10, fill: '#666'}} domain={[0, 100]} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'rgba(10,10,10,0.9)', border: '1px solid #333', borderRadius: '8px', backdropFilter: 'blur(10px)' }}
                    itemStyle={{ color: '#00f0ff', fontWeight: 'bold' }}
                    labelStyle={{ color: '#888', fontSize: '12px', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}
                  />
                  <Line type="monotone" dataKey="score" stroke="#00f0ff" strokeWidth={3} dot={{ fill: '#b026ff', r: 4, strokeWidth: 0 }} activeDot={{ r: 6, fill: '#fff' }} />
                </LineChart>
             </ResponsiveContainer>
           </div>
        </Card>
      </motion.div>

      {radarData.length > 0 && (
        <motion.div initial={{opacity: 0, y: 20}} animate={{opacity: 1, y: 0}} transition={{delay: 0.5}} className="md:col-span-3 pb-8">
          <Card interactive={false} className="border-border bg-surface/30 p-6 h-[400px]">
            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-4 block">Cognitive Distribution (Category Analysis)</span>
            <div className="w-full h-full pb-8">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid stroke="rgba(255,255,255,0.1)" />
                  <PolarAngleAxis dataKey="topic" tick={{ fill: '#888', fontSize: 10 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#666', fontSize: 10 }} />
                  <Radar name="Proficiency" dataKey="score" stroke="#b026ff" fill="#b026ff" fillOpacity={0.5} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'rgba(10,10,10,0.9)', border: '1px solid #333', borderRadius: '8px', backdropFilter: 'blur(10px)' }}
                    itemStyle={{ color: '#b026ff', fontWeight: 'bold' }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </motion.div>
      )}
    </>
  );
}
