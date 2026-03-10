import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import {
  Calendar,
  Clock,
  Dumbbell,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  Trophy,
} from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { WorkoutLog, ExerciseLog, Session, Exercise } from '@/types/database';

interface WorkoutWithDetails extends WorkoutLog {
  session: Session;
  exercise_logs: (ExerciseLog & { exercise: Exercise })[];
}

export default function HistoryScreen() {
  const [workouts, setWorkouts] = useState<WorkoutWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedWorkout, setExpandedWorkout] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalWorkouts: 0,
    totalSets: 0,
    totalVolume: 0,
    streak: 0,
  });

  useFocusEffect(
    useCallback(() => {
      fetchHistory();
    }, [])
  );

  const fetchHistory = async () => {
    const { data: workoutData } = await supabase
      .from('workout_logs')
      .select('*')
      .not('completed_at', 'is', null)
      .order('completed_at', { ascending: false });

    if (!workoutData) {
      setLoading(false);
      return;
    }

    const workoutsWithDetails: WorkoutWithDetails[] = [];

    for (const workout of workoutData) {
      const { data: sessionData } = await supabase
        .from('sessions')
        .select('*')
        .eq('id', workout.session_id)
        .maybeSingle();

      const { data: logsData } = await supabase
        .from('exercise_logs')
        .select('*')
        .eq('workout_log_id', workout.id)
        .order('created_at');

      const logsWithExercises = [];
      for (const log of logsData || []) {
        const { data: exerciseData } = await supabase
          .from('exercises')
          .select('*')
          .eq('id', log.exercise_id)
          .maybeSingle();

        if (exerciseData) {
          logsWithExercises.push({ ...log, exercise: exerciseData });
        }
      }

      if (sessionData) {
        workoutsWithDetails.push({
          ...workout,
          session: sessionData,
          exercise_logs: logsWithExercises,
        });
      }
    }

    setWorkouts(workoutsWithDetails);
    calculateStats(workoutsWithDetails);
    setLoading(false);
  };

  const calculateStats = (workoutList: WorkoutWithDetails[]) => {
    const totalWorkouts = workoutList.length;
    let totalSets = 0;
    let totalVolume = 0;

    workoutList.forEach((workout) => {
      workout.exercise_logs.forEach((log) => {
        totalSets += 1;
        if (log.weight_kg && log.reps_completed) {
          totalVolume += log.weight_kg * log.reps_completed;
        }
      });
    });

    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < 30; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(checkDate.getDate() - i);
      const hasWorkout = workoutList.some((w) => {
        if (!w.completed_at) return false;
        const workoutDate = new Date(w.completed_at);
        workoutDate.setHours(0, 0, 0, 0);
        return workoutDate.getTime() === checkDate.getTime();
      });

      if (hasWorkout) {
        streak++;
      } else if (i > 0) {
        break;
      }
    }

    setStats({ totalWorkouts, totalSets, totalVolume: Math.round(totalVolume), streak });
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchHistory();
    setRefreshing(false);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
  };

  const formatDuration = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffMs = endDate.getTime() - startDate.getTime();
    const minutes = Math.round(diffMs / 60000);
    return `${minutes} min`;
  };

  const toggleExpand = (id: string) => {
    setExpandedWorkout(expandedWorkout === id ? null : id);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Historique</Text>
        <Text style={styles.subtitle}>Tes performances passees</Text>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Trophy size={24} color="#F59E0B" />
          <Text style={styles.statValue}>{stats.streak}</Text>
          <Text style={styles.statLabel}>Jours</Text>
        </View>
        <View style={styles.statCard}>
          <Dumbbell size={24} color="#10B981" />
          <Text style={styles.statValue}>{stats.totalWorkouts}</Text>
          <Text style={styles.statLabel}>Seances</Text>
        </View>
        <View style={styles.statCard}>
          <TrendingUp size={24} color="#3B82F6" />
          <Text style={styles.statValue}>
            {stats.totalVolume > 1000
              ? `${(stats.totalVolume / 1000).toFixed(1)}t`
              : `${stats.totalVolume}kg`}
          </Text>
          <Text style={styles.statLabel}>Volume</Text>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#10B981"
          />
        }>
        {workouts.length === 0 ? (
          <View style={styles.emptyState}>
            <Calendar size={48} color="#6B7280" />
            <Text style={styles.emptyTitle}>Pas encore d'historique</Text>
            <Text style={styles.emptySubtitle}>
              Complete ta premiere seance pour voir tes performances ici
            </Text>
          </View>
        ) : (
          workouts.map((workout) => {
            const isExpanded = expandedWorkout === workout.id;
            const exerciseGroups = new Map<string, (ExerciseLog & { exercise: Exercise })[]>();

            workout.exercise_logs.forEach((log) => {
              const existing = exerciseGroups.get(log.exercise_id) || [];
              existing.push(log);
              exerciseGroups.set(log.exercise_id, existing);
            });

            return (
              <TouchableOpacity
                key={workout.id}
                style={styles.workoutCard}
                onPress={() => toggleExpand(workout.id)}
                activeOpacity={0.8}>
                <View style={styles.workoutHeader}>
                  <View style={styles.workoutInfo}>
                    <Text style={styles.workoutDate}>
                      {formatDate(workout.completed_at!)}
                    </Text>
                    <Text style={styles.workoutName}>{workout.session.name}</Text>
                    <View style={styles.workoutMeta}>
                      <Clock size={14} color="#6B7280" />
                      <Text style={styles.workoutMetaText}>
                        {formatDuration(workout.started_at, workout.completed_at!)}
                      </Text>
                      <Text style={styles.workoutMetaSeparator}>-</Text>
                      <Text style={styles.workoutMetaText}>
                        {workout.exercise_logs.length} series
                      </Text>
                    </View>
                  </View>
                  {isExpanded ? (
                    <ChevronUp size={24} color="#6B7280" />
                  ) : (
                    <ChevronDown size={24} color="#6B7280" />
                  )}
                </View>

                {isExpanded && (
                  <View style={styles.workoutDetails}>
                    {Array.from(exerciseGroups.entries()).map(([exId, logs]) => {
                      const exerciseName = logs[0].exercise.name;
                      return (
                        <View key={exId} style={styles.exerciseGroup}>
                          <Text style={styles.exerciseGroupName}>{exerciseName}</Text>
                          <View style={styles.setsTable}>
                            {logs.map((log, index) => (
                              <View key={log.id} style={styles.setRow}>
                                <Text style={styles.setNumber}>S{log.set_number}</Text>
                                {log.reps_completed && (
                                  <Text style={styles.setValue}>
                                    {log.reps_completed} reps
                                  </Text>
                                )}
                                {log.weight_kg && (
                                  <Text style={styles.setValue}>{log.weight_kg} kg</Text>
                                )}
                                {log.time_seconds && (
                                  <Text style={styles.setValue}>
                                    {log.time_seconds}s
                                  </Text>
                                )}
                                {log.distance_m && (
                                  <Text style={styles.setValue}>{log.distance_m}m</Text>
                                )}
                              </View>
                            ))}
                          </View>
                        </View>
                      );
                    })}
                  </View>
                )}
              </TouchableOpacity>
            );
          })
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: 16,
    color: '#9CA3AF',
    marginTop: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
  },
  workoutCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  workoutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  workoutInfo: {
    flex: 1,
  },
  workoutDate: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  workoutName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 4,
  },
  workoutMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  workoutMetaText: {
    fontSize: 14,
    color: '#6B7280',
  },
  workoutMetaSeparator: {
    color: '#4B5563',
  },
  workoutDetails: {
    borderTopWidth: 1,
    borderTopColor: '#334155',
    marginTop: 16,
    paddingTop: 16,
  },
  exerciseGroup: {
    marginBottom: 16,
  },
  exerciseGroupName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  setsTable: {
    gap: 6,
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#334155',
    borderRadius: 8,
  },
  setNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9CA3AF',
    width: 30,
  },
  setValue: {
    fontSize: 14,
    color: '#FFFFFF',
  },
  bottomSpacer: {
    height: 20,
  },
});
