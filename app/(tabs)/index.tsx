import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronRight, Clock, Dumbbell, Flame, Target } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { Week, Session, Exercise } from '@/types/database';

interface WeekData extends Week {
  sessions: (Session & { exercises: Exercise[] })[];
}

export default function ProgramScreen() {
  const router = useRouter();
  const [weeks, setWeeks] = useState<WeekData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWeek, setSelectedWeek] = useState(1);
  const [completedSessions, setCompletedSessions] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchProgram();
    fetchCompletedSessions();
  }, []);

  const fetchProgram = async () => {
    const { data: weeksData } = await supabase
      .from('weeks')
      .select('*')
      .order('week_number');

    if (!weeksData) return;

    const weeksWithSessions: WeekData[] = [];

    for (const week of weeksData) {
      const { data: sessions } = await supabase
        .from('sessions')
        .select('*')
        .eq('week_id', week.id)
        .order('session_number');

      const sessionsWithExercises = [];

      for (const session of sessions || []) {
        const { data: exercises } = await supabase
          .from('exercises')
          .select('*')
          .eq('session_id', session.id)
          .order('order_index');

        sessionsWithExercises.push({
          ...session,
          exercises: exercises || [],
        });
      }

      weeksWithSessions.push({
        ...week,
        sessions: sessionsWithExercises,
      });
    }

    setWeeks(weeksWithSessions);
    setLoading(false);
  };

  const fetchCompletedSessions = async () => {
    const { data } = await supabase
      .from('workout_logs')
      .select('session_id')
      .not('completed_at', 'is', null);

    if (data) {
      setCompletedSessions(new Set(data.map((d) => d.session_id)));
    }
  };

  const startWorkout = (session: Session & { exercises: Exercise[] }) => {
    router.push({
      pathname: '/workout',
      params: { sessionId: session.id },
    });
  };

  const currentWeek = weeks.find((w) => w.week_number === selectedWeek);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'finisher':
        return <Flame size={16} color="#F59E0B" />;
      case 'grip':
        return <Target size={16} color="#8B5CF6" />;
      default:
        return <Dumbbell size={16} color="#10B981" />;
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#10B981" />
          <Text style={styles.loadingText}>Chargement du programme...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Programme Hyrox</Text>
        <Text style={styles.subtitle}>3 semaines de preparation</Text>
      </View>

      <View style={styles.weekSelector}>
        {weeks.map((week) => (
          <TouchableOpacity
            key={week.id}
            style={[
              styles.weekTab,
              selectedWeek === week.week_number && styles.weekTabActive,
            ]}
            onPress={() => setSelectedWeek(week.week_number)}>
            <Text
              style={[
                styles.weekTabText,
                selectedWeek === week.week_number && styles.weekTabTextActive,
              ]}>
              S{week.week_number}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {currentWeek?.sessions.map((session) => {
          const isCompleted = completedSessions.has(session.id);
          const totalSets = session.exercises.reduce(
            (acc, ex) => acc + (ex.sets || 0),
            0
          );

          return (
            <TouchableOpacity
              key={session.id}
              style={[styles.sessionCard, isCompleted && styles.sessionCardCompleted]}
              onPress={() => startWorkout(session)}>
              <View style={styles.sessionHeader}>
                <View style={styles.sessionInfo}>
                  <View style={styles.sessionTitleRow}>
                    <Text style={styles.sessionNumber}>
                      Seance {session.session_number}
                    </Text>
                    {session.is_optional && (
                      <View style={styles.optionalBadge}>
                        <Text style={styles.optionalText}>Optionnel</Text>
                      </View>
                    )}
                    {isCompleted && (
                      <View style={styles.completedBadge}>
                        <Text style={styles.completedText}>Termine</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.sessionName}>{session.name}</Text>
                  <View style={styles.sessionMeta}>
                    <View style={styles.metaItem}>
                      <Dumbbell size={14} color="#6B7280" />
                      <Text style={styles.metaText}>
                        {session.exercises.length} exercices
                      </Text>
                    </View>
                    <View style={styles.metaItem}>
                      <Clock size={14} color="#6B7280" />
                      <Text style={styles.metaText}>{totalSets} series</Text>
                    </View>
                  </View>
                </View>
                <ChevronRight size={24} color="#6B7280" />
              </View>

              <View style={styles.exerciseList}>
                {session.exercises.slice(0, 4).map((exercise, index) => (
                  <View key={exercise.id} style={styles.exercisePreview}>
                    {getCategoryIcon(exercise.category)}
                    <Text style={styles.exercisePreviewText} numberOfLines={1}>
                      {exercise.name}
                    </Text>
                    {exercise.sets && exercise.reps && (
                      <Text style={styles.exercisePreviewSets}>
                        {exercise.sets}x{exercise.reps}
                      </Text>
                    )}
                  </View>
                ))}
                {session.exercises.length > 4 && (
                  <Text style={styles.moreExercises}>
                    +{session.exercises.length - 4} exercices
                  </Text>
                )}
              </View>
            </TouchableOpacity>
          );
        })}

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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#9CA3AF',
    marginTop: 16,
    fontSize: 16,
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
  weekSelector: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  weekTab: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#1E293B',
    alignItems: 'center',
  },
  weekTabActive: {
    backgroundColor: '#10B981',
  },
  weekTabText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  weekTabTextActive: {
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  sessionCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  sessionCardCompleted: {
    borderColor: '#10B981',
    opacity: 0.8,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  sessionInfo: {
    flex: 1,
  },
  sessionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  sessionNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10B981',
    textTransform: 'uppercase',
  },
  optionalBadge: {
    backgroundColor: '#374151',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  optionalText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  completedBadge: {
    backgroundColor: '#065F46',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  completedText: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '600',
  },
  sessionName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 4,
  },
  sessionMeta: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 8,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 14,
    color: '#6B7280',
  },
  exerciseList: {
    borderTopWidth: 1,
    borderTopColor: '#334155',
    paddingTop: 12,
    gap: 8,
  },
  exercisePreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  exercisePreviewText: {
    flex: 1,
    fontSize: 14,
    color: '#D1D5DB',
  },
  exercisePreviewSets: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  moreExercises: {
    fontSize: 14,
    color: '#6B7280',
    fontStyle: 'italic',
    marginTop: 4,
  },
  bottomSpacer: {
    height: 20,
  },
});
