import { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Vibration,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  Play,
  Pause,
  SkipForward,
  Check,
  Clock,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Timer,
} from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { Session, Exercise, ExerciseLog } from '@/types/database';

interface SetLog {
  reps?: number;
  weight?: number;
  distance?: number;
  time?: number;
  completed: boolean;
}

interface ExerciseProgress {
  exercise: Exercise;
  sets: SetLog[];
}

export default function WorkoutScreen() {
  const { sessionId } = useLocalSearchParams<{ sessionId?: string }>();
  const router = useRouter();

  const [session, setSession] = useState<Session | null>(null);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [currentSetIndex, setCurrentSetIndex] = useState(0);
  const [progress, setProgress] = useState<Map<string, ExerciseProgress>>(new Map());
  const [workoutLogId, setWorkoutLogId] = useState<string | null>(null);
  const [workoutStarted, setWorkoutStarted] = useState(false);
  const [restTimer, setRestTimer] = useState(0);
  const [isResting, setIsResting] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const restTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (sessionId) {
      fetchSession(sessionId);
    }
  }, [sessionId]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (restTimerRef.current) clearInterval(restTimerRef.current);
    };
  }, []);

  const fetchSession = async (id: string) => {
    const { data: sessionData } = await supabase
      .from('sessions')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (sessionData) {
      setSession(sessionData);

      const { data: exercisesData } = await supabase
        .from('exercises')
        .select('*')
        .eq('session_id', id)
        .order('order_index');

      if (exercisesData) {
        setExercises(exercisesData);
        initializeProgress(exercisesData);
      }
    }
  };

  const initializeProgress = (exerciseList: Exercise[]) => {
    const newProgress = new Map<string, ExerciseProgress>();
    exerciseList.forEach((exercise) => {
      const sets: SetLog[] = Array.from({ length: exercise.sets || 1 }, () => ({
        completed: false,
      }));
      newProgress.set(exercise.id, { exercise, sets });
    });
    setProgress(newProgress);
  };

  const startWorkout = async () => {
    const { data } = await supabase
      .from('workout_logs')
      .insert({
        session_id: sessionId,
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (data) {
      setWorkoutLogId(data.id);
      setWorkoutStarted(true);
      timerRef.current = setInterval(() => {
        setElapsedTime((prev) => prev + 1);
      }, 1000);
    }
  };

  const startRestTimer = (seconds: number) => {
    setRestTimer(seconds);
    setIsResting(true);

    if (restTimerRef.current) clearInterval(restTimerRef.current);

    restTimerRef.current = setInterval(() => {
      setRestTimer((prev) => {
        if (prev <= 1) {
          if (restTimerRef.current) clearInterval(restTimerRef.current);
          setIsResting(false);
          if (Platform.OS !== 'web') {
            Vibration.vibrate([0, 500, 200, 500]);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const skipRest = () => {
    if (restTimerRef.current) clearInterval(restTimerRef.current);
    setRestTimer(0);
    setIsResting(false);
  };

  const updateSetLog = (
    exerciseId: string,
    setIndex: number,
    field: keyof SetLog,
    value: number | boolean
  ) => {
    setProgress((prev) => {
      const newProgress = new Map(prev);
      const exerciseProgress = newProgress.get(exerciseId);
      if (exerciseProgress) {
        const newSets = [...exerciseProgress.sets];
        newSets[setIndex] = { ...newSets[setIndex], [field]: value };
        newProgress.set(exerciseId, { ...exerciseProgress, sets: newSets });
      }
      return newProgress;
    });
  };

  const completeSet = async () => {
    const currentExercise = exercises[currentExerciseIndex];
    if (!currentExercise || !workoutLogId) return;

    const exerciseProgress = progress.get(currentExercise.id);
    if (!exerciseProgress) return;

    const setLog = exerciseProgress.sets[currentSetIndex];

    await supabase.from('exercise_logs').insert({
      workout_log_id: workoutLogId,
      exercise_id: currentExercise.id,
      set_number: currentSetIndex + 1,
      reps_completed: setLog.reps,
      weight_kg: setLog.weight,
      distance_m: setLog.distance,
      time_seconds: setLog.time,
    });

    updateSetLog(currentExercise.id, currentSetIndex, 'completed', true);

    const totalSets = currentExercise.sets || 1;
    if (currentSetIndex < totalSets - 1) {
      setCurrentSetIndex(currentSetIndex + 1);
      if (currentExercise.rest_seconds) {
        startRestTimer(currentExercise.rest_seconds);
      }
    } else if (currentExerciseIndex < exercises.length - 1) {
      setCurrentExerciseIndex(currentExerciseIndex + 1);
      setCurrentSetIndex(0);
      if (currentExercise.rest_seconds) {
        startRestTimer(currentExercise.rest_seconds);
      }
    }
  };

  const finishWorkout = async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (restTimerRef.current) clearInterval(restTimerRef.current);

    if (workoutLogId) {
      await supabase
        .from('workout_logs')
        .update({ completed_at: new Date().toISOString() })
        .eq('id', workoutLogId);
    }

    router.replace('/history');
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const currentExercise = exercises[currentExerciseIndex];
  const currentProgress = currentExercise
    ? progress.get(currentExercise.id)
    : null;

  const allSetsCompleted = exercises.every((ex) => {
    const prog = progress.get(ex.id);
    return prog?.sets.every((s) => s.completed);
  });

  if (!sessionId || !session) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyState}>
          <Timer size={64} color="#6B7280" />
          <Text style={styles.emptyTitle}>Aucune seance selectionnee</Text>
          <Text style={styles.emptySubtitle}>
            Selectionne une seance depuis l'onglet Programme pour commencer
          </Text>
          <TouchableOpacity
            style={styles.goToProgramButton}
            onPress={() => router.push('/')}>
            <Text style={styles.goToProgramText}>Voir le programme</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (!workoutStarted) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.startContainer}>
          <Text style={styles.startTitle}>{session.name}</Text>
          <Text style={styles.startSubtitle}>
            Semaine {session.session_number} - {exercises.length} exercices
          </Text>

          <View style={styles.exercisePreviewList}>
            {exercises.map((ex, index) => (
              <View key={ex.id} style={styles.previewItem}>
                <View style={styles.previewNumber}>
                  <Text style={styles.previewNumberText}>{index + 1}</Text>
                </View>
                <View style={styles.previewContent}>
                  <Text style={styles.previewName}>{ex.name}</Text>
                  <Text style={styles.previewDetails}>
                    {ex.sets && ex.reps ? `${ex.sets} x ${ex.reps}` : ex.reps}
                    {ex.target_load_kg ? ` @ ${ex.target_load_kg}kg` : ''}
                  </Text>
                </View>
              </View>
            ))}
          </View>

          <TouchableOpacity style={styles.startButton} onPress={startWorkout}>
            <Play size={24} color="#FFFFFF" fill="#FFFFFF" />
            <Text style={styles.startButtonText}>Commencer la seance</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}>
            <ChevronLeft size={20} color="#9CA3AF" />
            <Text style={styles.backButtonText}>Retour au programme</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.workoutHeader}>
        <View style={styles.timerRow}>
          <View style={styles.timerDisplay}>
            <Clock size={16} color="#10B981" />
            <Text style={styles.timerText}>{formatTime(elapsedTime)}</Text>
          </View>
          <Text style={styles.progressText}>
            {currentExerciseIndex + 1}/{exercises.length}
          </Text>
        </View>
      </View>

      {isResting && (
        <View style={styles.restOverlay}>
          <Text style={styles.restLabel}>Repos</Text>
          <Text style={styles.restTime}>{formatTime(restTimer)}</Text>
          <TouchableOpacity style={styles.skipButton} onPress={skipRest}>
            <SkipForward size={20} color="#FFFFFF" />
            <Text style={styles.skipText}>Passer</Text>
          </TouchableOpacity>
        </View>
      )}

      <ScrollView style={styles.workoutContent} showsVerticalScrollIndicator={false}>
        {currentExercise && currentProgress && (
          <View style={styles.exerciseCard}>
            <View style={styles.exerciseHeader}>
              <Text style={styles.exerciseName}>{currentExercise.name}</Text>
              {currentExercise.load_description && (
                <Text style={styles.exerciseLoad}>
                  {currentExercise.load_description}
                </Text>
              )}
            </View>

            {currentExercise.notes && (
              <View style={styles.notesBox}>
                <Text style={styles.notesText}>{currentExercise.notes}</Text>
              </View>
            )}

            <View style={styles.targetInfo}>
              <View style={styles.targetItem}>
                <Text style={styles.targetLabel}>Series</Text>
                <Text style={styles.targetValue}>{currentExercise.sets || '-'}</Text>
              </View>
              <View style={styles.targetItem}>
                <Text style={styles.targetLabel}>Reps/Dist</Text>
                <Text style={styles.targetValue}>{currentExercise.reps || '-'}</Text>
              </View>
              {currentExercise.tempo && (
                <View style={styles.targetItem}>
                  <Text style={styles.targetLabel}>Tempo</Text>
                  <Text style={styles.targetValue}>{currentExercise.tempo}</Text>
                </View>
              )}
              {currentExercise.rest_seconds && (
                <View style={styles.targetItem}>
                  <Text style={styles.targetLabel}>Repos</Text>
                  <Text style={styles.targetValue}>
                    {Math.floor(currentExercise.rest_seconds / 60)}m
                    {currentExercise.rest_seconds % 60 > 0
                      ? `${currentExercise.rest_seconds % 60}s`
                      : ''}
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.setsContainer}>
              <Text style={styles.setsTitle}>
                Serie {currentSetIndex + 1} sur {currentExercise.sets || 1}
              </Text>

              <View style={styles.inputsRow}>
                {currentExercise.category !== 'circuit' && (
                  <>
                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>Reps</Text>
                      <TextInput
                        style={styles.input}
                        keyboardType="numeric"
                        placeholder="-"
                        placeholderTextColor="#6B7280"
                        value={
                          currentProgress.sets[currentSetIndex]?.reps?.toString() ||
                          ''
                        }
                        onChangeText={(text) =>
                          updateSetLog(
                            currentExercise.id,
                            currentSetIndex,
                            'reps',
                            parseInt(text) || 0
                          )
                        }
                      />
                    </View>
                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>Poids (kg)</Text>
                      <TextInput
                        style={styles.input}
                        keyboardType="decimal-pad"
                        placeholder={
                          currentExercise.target_load_kg?.toString() || '-'
                        }
                        placeholderTextColor="#6B7280"
                        value={
                          currentProgress.sets[currentSetIndex]?.weight?.toString() ||
                          ''
                        }
                        onChangeText={(text) =>
                          updateSetLog(
                            currentExercise.id,
                            currentSetIndex,
                            'weight',
                            parseFloat(text) || 0
                          )
                        }
                      />
                    </View>
                  </>
                )}
                {(currentExercise.reps?.includes('m') ||
                  currentExercise.category === 'finisher') && (
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Temps (sec)</Text>
                    <TextInput
                      style={styles.input}
                      keyboardType="numeric"
                      placeholder="-"
                      placeholderTextColor="#6B7280"
                      value={
                        currentProgress.sets[currentSetIndex]?.time?.toString() || ''
                      }
                      onChangeText={(text) =>
                        updateSetLog(
                          currentExercise.id,
                          currentSetIndex,
                          'time',
                          parseInt(text) || 0
                        )
                      }
                    />
                  </View>
                )}
              </View>

              <TouchableOpacity
                style={styles.completeButton}
                onPress={completeSet}>
                <Check size={24} color="#FFFFFF" />
                <Text style={styles.completeButtonText}>Valider la serie</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.setsProgress}>
              {currentProgress.sets.map((set, index) => (
                <View
                  key={index}
                  style={[
                    styles.setDot,
                    set.completed && styles.setDotCompleted,
                    index === currentSetIndex && styles.setDotCurrent,
                  ]}
                />
              ))}
            </View>
          </View>
        )}

        <View style={styles.navigationButtons}>
          <TouchableOpacity
            style={[
              styles.navButton,
              currentExerciseIndex === 0 && styles.navButtonDisabled,
            ]}
            disabled={currentExerciseIndex === 0}
            onPress={() => {
              setCurrentExerciseIndex(currentExerciseIndex - 1);
              setCurrentSetIndex(0);
            }}>
            <ChevronLeft size={20} color="#FFFFFF" />
            <Text style={styles.navButtonText}>Precedent</Text>
          </TouchableOpacity>

          {currentExerciseIndex < exercises.length - 1 ? (
            <TouchableOpacity
              style={styles.navButton}
              onPress={() => {
                setCurrentExerciseIndex(currentExerciseIndex + 1);
                setCurrentSetIndex(0);
              }}>
              <Text style={styles.navButtonText}>Suivant</Text>
              <ChevronRight size={20} color="#FFFFFF" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.navButton, styles.finishButton]}
              onPress={finishWorkout}>
              <Check size={20} color="#FFFFFF" />
              <Text style={styles.navButtonText}>Terminer</Text>
            </TouchableOpacity>
          )}
        </View>

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
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 24,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#9CA3AF',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 24,
  },
  goToProgramButton: {
    marginTop: 32,
    backgroundColor: '#10B981',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
  },
  goToProgramText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  startContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 40,
  },
  startTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  startSubtitle: {
    fontSize: 16,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 8,
  },
  exercisePreviewList: {
    marginTop: 32,
    gap: 12,
  },
  previewItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 12,
    gap: 12,
  },
  previewNumber: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#334155',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewNumberText: {
    color: '#9CA3AF',
    fontWeight: '600',
  },
  previewContent: {
    flex: 1,
  },
  previewName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  previewDetails: {
    color: '#6B7280',
    fontSize: 14,
    marginTop: 2,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    paddingVertical: 18,
    borderRadius: 16,
    marginTop: 32,
    gap: 12,
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    gap: 4,
  },
  backButtonText: {
    color: '#9CA3AF',
    fontSize: 16,
  },
  workoutHeader: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  timerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timerDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timerText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    fontVariant: ['tabular-nums'],
  },
  progressText: {
    fontSize: 16,
    color: '#9CA3AF',
    fontWeight: '600',
  },
  restOverlay: {
    backgroundColor: '#1E293B',
    margin: 20,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#F59E0B',
  },
  restLabel: {
    fontSize: 16,
    color: '#F59E0B',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  restTime: {
    fontSize: 64,
    fontWeight: '700',
    color: '#FFFFFF',
    fontVariant: ['tabular-nums'],
  },
  skipButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#374151',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 16,
    gap: 8,
  },
  skipText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  workoutContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  exerciseCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 20,
    marginTop: 20,
  },
  exerciseHeader: {
    marginBottom: 12,
  },
  exerciseName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  exerciseLoad: {
    fontSize: 16,
    color: '#10B981',
    marginTop: 4,
    fontWeight: '500',
  },
  notesBox: {
    backgroundColor: '#334155',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  notesText: {
    color: '#F59E0B',
    fontSize: 14,
    lineHeight: 20,
  },
  targetInfo: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  targetItem: {
    backgroundColor: '#334155',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minWidth: 70,
  },
  targetLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 2,
  },
  targetValue: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  setsContainer: {
    borderTopWidth: 1,
    borderTopColor: '#334155',
    paddingTop: 16,
  },
  setsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  inputsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  inputGroup: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#374151',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 18,
    color: '#FFFFFF',
    textAlign: 'center',
    fontWeight: '600',
  },
  completeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  completeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  setsProgress: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
  },
  setDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#374151',
  },
  setDotCompleted: {
    backgroundColor: '#10B981',
  },
  setDotCurrent: {
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  navigationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    gap: 12,
  },
  navButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#374151',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 6,
  },
  navButtonDisabled: {
    opacity: 0.5,
  },
  navButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  finishButton: {
    backgroundColor: '#059669',
  },
  bottomSpacer: {
    height: 40,
  },
});
