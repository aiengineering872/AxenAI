'use client';

import React, { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { motion } from 'framer-motion';
import { Trophy, Medal, Award, TrendingUp } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface LeaderboardEntry {
  rank: number;
  userId: string;
  name: string;
  photoURL?: string;
  xp: number;
  level: number;
  badges: number;
}

const mockLeaderboard: LeaderboardEntry[] = [
  { rank: 1, userId: '1', name: 'Alice Johnson', xp: 5420, level: 15, badges: 12 },
  { rank: 2, userId: '2', name: 'Bob Smith', xp: 4890, level: 14, badges: 10 },
  { rank: 3, userId: '3', name: 'Charlie Brown', xp: 4320, level: 13, badges: 9 },
  { rank: 4, userId: '4', name: 'Diana Prince', xp: 3980, level: 12, badges: 8 },
  { rank: 5, userId: '5', name: 'Eve Wilson', xp: 3650, level: 11, badges: 7 },
];

export default function LeaderboardPage() {
  const { user } = useAuth();
  const [filter, setFilter] = useState<'all' | 'weekly' | 'monthly'>('all');

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="w-6 h-6 text-yellow-400" />;
    if (rank === 2) return <Medal className="w-6 h-6 text-gray-400" />;
    if (rank === 3) return <Award className="w-6 h-6 text-orange-400" />;
    return <span className="text-lg font-bold text-textSecondary">#{rank}</span>;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-text mb-2">Leaderboard</h1>
          <p className="text-textSecondary">Top performers and achievements</p>
        </motion.div>

        {/* Filter */}
        <div className="flex gap-4">
          {(['all', 'weekly', 'monthly'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg transition-all ${
                filter === f
                  ? 'bg-primary text-white'
                  : 'bg-card text-textSecondary hover:text-text'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {/* Top 3 Podium */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[2, 1, 3].map((rank) => {
            const entry = mockLeaderboard.find((e) => e.rank === rank);
            if (!entry) return null;
            return (
              <motion.div
                key={rank}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: rank * 0.1 }}
                className={`glass p-6 rounded-xl text-center ${
                  rank === 1 ? 'order-2' : rank === 2 ? 'order-1' : 'order-3'
                }`}
              >
                <div className="mb-4">{getRankIcon(rank)}</div>
                {entry.photoURL ? (
                  <img
                    src={entry.photoURL}
                    alt={entry.name}
                    className="w-16 h-16 rounded-full mx-auto mb-3"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-primary mx-auto mb-3 flex items-center justify-center text-white font-bold text-xl">
                    {entry.name[0]}
                  </div>
                )}
                <h3 className="font-bold text-text mb-1">{entry.name}</h3>
                <p className="text-sm text-textSecondary mb-2">Level {entry.level}</p>
                <div className="flex items-center justify-center gap-2">
                  <TrendingUp className="w-4 h-4 text-primary" />
                  <span className="font-medium">{entry.xp.toLocaleString()} XP</span>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Full Leaderboard */}
        <div className="glass rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-card/50">
                <tr>
                  <th className="text-left py-4 px-6 text-textSecondary font-medium">Rank</th>
                  <th className="text-left py-4 px-6 text-textSecondary font-medium">Learner</th>
                  <th className="text-left py-4 px-6 text-textSecondary font-medium">Level</th>
                  <th className="text-left py-4 px-6 text-textSecondary font-medium">XP</th>
                  <th className="text-left py-4 px-6 text-textSecondary font-medium">Badges</th>
                </tr>
              </thead>
              <tbody>
                {mockLeaderboard.map((entry, index) => (
                  <tr
                    key={entry.userId}
                    className={`border-t border-card hover:bg-card/50 transition-all ${
                      user?.uid === entry.userId ? 'bg-primary/10' : ''
                    }`}
                  >
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        {getRankIcon(entry.rank)}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        {entry.photoURL ? (
                          <img
                            src={entry.photoURL}
                            alt={entry.name}
                            className="w-10 h-10 rounded-full"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-bold">
                            {entry.name[0]}
                          </div>
                        )}
                        <span className="font-medium text-text">{entry.name}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-text">Level {entry.level}</span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="font-medium text-text">{entry.xp.toLocaleString()}</span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-1">
                        <Award className="w-4 h-4 text-primary" />
                        <span className="text-text">{entry.badges}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

