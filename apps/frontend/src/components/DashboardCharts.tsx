'use client';

import React from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Card, Skeleton } from '@side-project/design-system';
import { useStatsOverview, useActivityStats, useHourlyStats, useUserTypeStats } from '../hooks/useStats';

// 색상 팔레트
const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4'];

export const UserActivityChart: React.FC = () => {
  const { data: activityData, isLoading } = useActivityStats();

  if (isLoading) {
    return (
      <Card variant="elevated" padding="lg" className="dark:bg-gray-800">
        <Skeleton width={200} height={24} className="mb-4" />
        <Skeleton width="100%" height={300} />
      </Card>
    );
  }

  return (
    <Card variant="elevated" padding="lg" className="dark:bg-gray-800">
      <h3 className="text-lg font-semibold mb-4 dark:text-gray-100">주간 사용자 활동</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={activityData || []}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-gray-300 dark:stroke-gray-700" />
          <XAxis 
            dataKey="name" 
            className="text-gray-600 dark:text-gray-400"
            tick={{ fill: 'currentColor' }}
          />
          <YAxis 
            className="text-gray-600 dark:text-gray-400"
            tick={{ fill: 'currentColor' }}
          />
          <Tooltip 
            contentStyle={{
              backgroundColor: 'var(--tw-color-gray-100)',
              border: '1px solid var(--tw-color-gray-300)',
              borderRadius: '0.5rem',
            }}
            className="dark:bg-gray-700 dark:border-gray-600"
          />
          <Legend />
          <Line 
            type="monotone" 
            dataKey="users" 
            stroke="#3b82f6" 
            strokeWidth={2}
            name="전체 사용자"
          />
          <Line 
            type="monotone" 
            dataKey="active" 
            stroke="#10b981" 
            strokeWidth={2}
            name="활성 사용자"
          />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
};

export const UserTypeChart: React.FC = () => {
  const { data: userTypeData, isLoading } = useUserTypeStats();

  if (isLoading) {
    return (
      <Card variant="elevated" padding="lg" className="dark:bg-gray-800">
        <Skeleton width={200} height={24} className="mb-4" />
        <Skeleton width="100%" height={300} />
      </Card>
    );
  }

  return (
    <Card variant="elevated" padding="lg" className="dark:bg-gray-800">
      <h3 className="text-lg font-semibold mb-4 dark:text-gray-100">사용자 유형 분포</h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={userTypeData || []}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {(userTypeData || []).map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </Card>
  );
};

export const HourlyActivityChart: React.FC = () => {
  const { data: hourlyData, isLoading } = useHourlyStats();

  if (isLoading) {
    return (
      <Card variant="elevated" padding="lg" className="dark:bg-gray-800">
        <Skeleton width={200} height={24} className="mb-4" />
        <Skeleton width="100%" height={300} />
      </Card>
    );
  }

  return (
    <Card variant="elevated" padding="lg" className="dark:bg-gray-800">
      <h3 className="text-lg font-semibold mb-4 dark:text-gray-100">시간대별 가입 분포</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={hourlyData || []}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-gray-300 dark:stroke-gray-700" />
          <XAxis 
            dataKey="time" 
            className="text-gray-600 dark:text-gray-400"
            tick={{ fill: 'currentColor' }}
          />
          <YAxis 
            className="text-gray-600 dark:text-gray-400"
            tick={{ fill: 'currentColor' }}
          />
          <Tooltip 
            contentStyle={{
              backgroundColor: 'var(--tw-color-gray-100)',
              border: '1px solid var(--tw-color-gray-300)',
              borderRadius: '0.5rem',
            }}
            className="dark:bg-gray-700 dark:border-gray-600"
          />
          <Bar dataKey="count" fill="#8b5cf6" name="활동 수" />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
};

export const StatsOverview: React.FC = () => {
  const { data: statsData, isLoading } = useStatsOverview();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} variant="elevated" padding="md" className="dark:bg-gray-800">
            <Skeleton width={100} height={16} className="mb-2" />
            <Skeleton width={80} height={24} className="mb-1" />
            <Skeleton width={60} height={14} />
          </Card>
        ))}
      </div>
    );
  }

  const formatNumber = (num: number) => {
    return num.toLocaleString('ko-KR');
  };

  const stats = [
    { 
      label: '총 사용자', 
      value: formatNumber(statsData?.totalUsers || 0), 
      change: statsData?.growthRate ? `${statsData.growthRate > 0 ? '+' : ''}${statsData.growthRate}%` : '0%', 
      color: 'text-blue-600 dark:text-blue-400' 
    },
    { 
      label: '최근 7일 가입', 
      value: formatNumber(statsData?.recentUsers7d || 0), 
      change: `${formatNumber(statsData?.recentUsers30d || 0)}명 (30일)`, 
      color: 'text-green-600 dark:text-green-400' 
    },
    { 
      label: '오늘 가입', 
      value: formatNumber(statsData?.todayUsers || 0), 
      change: '신규', 
      color: 'text-purple-600 dark:text-purple-400' 
    },
    { 
      label: '성장률', 
      value: `${statsData?.growthRate || 0}%`, 
      change: '전주 대비', 
      color: 'text-orange-600 dark:text-orange-400' 
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {stats.map((stat, index) => (
        <Card key={index} variant="elevated" padding="md" className="dark:bg-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{stat.label}</p>
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
              <p className="text-xs text-green-600 dark:text-green-400 mt-1">{stat.change}</p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};

