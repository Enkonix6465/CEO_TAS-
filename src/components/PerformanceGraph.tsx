import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Clock, CheckCircle, AlertCircle } from 'lucide-react';

interface PerformanceGraphProps {
  overallPerformance: number;
  onTimeRate: number;
  overdueTasks: number;
  avgDelay: string;
  className?: string;
}

export const PerformanceGraph: React.FC<PerformanceGraphProps> = ({
  overallPerformance,
  onTimeRate,
  overdueTasks,
  avgDelay,
  className = ""
}) => {
  const getPerformanceColor = (value: number) => {
    if (value >= 80) return 'text-green-600 dark:text-green-400';
    if (value >= 60) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getPerformanceBg = (value: number) => {
    if (value >= 80) return 'bg-green-100 dark:bg-green-900/20';
    if (value >= 60) return 'bg-yellow-100 dark:bg-yellow-900/20';
    return 'bg-red-100 dark:bg-red-900/20';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`liquid-glass-card ${className}`}
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Performance Overview
        </h3>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 text-xs rounded-full font-medium bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-500/30">
            {overallPerformance >= 80 ? 'Improving' : 'Needs Attention'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Overall Performance */}
        <motion.div
          whileHover={{ scale: 1.05 }}
          className="liquid-glass-stats group cursor-pointer"
        >
          <div className="flex items-center justify-between mb-2 relative z-10">
            <span className="text-sm font-medium text-gray-600 dark:text-purple-300/90">
              Overall Performance
            </span>
          </div>
          <div className="flex items-baseline gap-1 relative z-10">
            <span className="text-3xl font-bold text-gray-900 dark:text-white">
              {overallPerformance}%
            </span>
          </div>
          <div className="mt-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${overallPerformance}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className={`h-2 rounded-full ${
                overallPerformance >= 80 ? 'bg-green-500' : 
                overallPerformance >= 60 ? 'bg-yellow-500' : 'bg-red-500'
              }`}
            />
          </div>
        </motion.div>

        {/* On-Time Rate */}
        <motion.div
          whileHover={{ scale: 1.05 }}
          className="liquid-glass-stats group cursor-pointer"
        >
          <div className="flex items-center justify-between mb-2 relative z-10">
            <span className="text-sm font-medium text-gray-600 dark:text-purple-300/90">
              On-Time Rate
            </span>
          </div>
          <div className="flex items-baseline gap-1 relative z-10">
            <span className="text-3xl font-bold text-gray-900 dark:text-white">
              {onTimeRate}%
            </span>
          </div>
          <div className="mt-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${onTimeRate}%` }}
              transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
              className={`h-2 rounded-full ${
                onTimeRate >= 80 ? 'bg-green-500' : 
                onTimeRate >= 60 ? 'bg-yellow-500' : 'bg-red-500'
              }`}
            />
          </div>
        </motion.div>

        {/* Overdue Tasks */}
        <motion.div
          whileHover={{ scale: 1.05 }}
          className="liquid-glass-stats group cursor-pointer"
        >
          <div className="flex items-center justify-between mb-2 relative z-10">
            <span className="text-sm font-medium text-gray-600 dark:text-purple-300/90">
              Overdue Tasks
            </span>
          </div>
          <div className="flex items-baseline gap-1 relative z-10">
            <span className="text-3xl font-bold text-gray-900 dark:text-white">
              {overdueTasks}
            </span>
          </div>
          <div className="mt-3 relative z-10">
            <span className="text-xs text-gray-600 dark:text-purple-300/70">
              Need attention
            </span>
          </div>
        </motion.div>

        {/* Average Delay */}
        <motion.div
          whileHover={{ scale: 1.05 }}
          className="liquid-glass-stats group cursor-pointer"
        >
          <div className="flex items-center justify-between mb-2 relative z-10">
            <span className="text-sm font-medium text-gray-600 dark:text-purple-300/90">
              Avg Delay
            </span>
          </div>
          <div className="flex items-baseline gap-1 relative z-10">
            <span className="text-3xl font-bold text-gray-900 dark:text-white">
              {avgDelay}
            </span>
          </div>
          <div className="mt-3 relative z-10">
            <span className="text-xs text-gray-600 dark:text-purple-300/70">
              Per task
            </span>
          </div>
        </motion.div>
      </div>

      {/* Performance Summary */}
      <div className="mt-6 liquid-glass-card">
        <div className="flex items-center gap-3">
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              Performance Summary
            </p>
            <p className="text-xs text-gray-600 dark:text-purple-300/70">
              {overallPerformance >= 80
                ? 'Excellent performance! Keep up the great work.'
                : overallPerformance >= 60
                ? 'Good progress, but there\'s room for improvement.'
                : 'Performance needs attention. Consider reviewing processes.'
              }
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
