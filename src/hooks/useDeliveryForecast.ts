import { useMemo } from "react";
import { useReportData } from "./useReportData";

export interface DeliveryForecast {
  projectId?: string;
  totalPoints: number;
  completedPoints: number;
  remainingPoints: number;
  progressPercent: number;
  avgVelocity: number;
  minVelocity: number;
  maxVelocity: number;
  avgSprintDays: number;
  estimatedOptimistic: Date | null;
  estimatedRealistic: Date | null;
  estimatedPessimistic: Date | null;
  sprintsRemaining: { optimistic: number; realistic: number; pessimistic: number };
  hasEnoughData: boolean;
}

export function useDeliveryForecast(projectId?: string): {
  forecast: DeliveryForecast;
  isLoading: boolean;
} {
  const { tasks, sprints, isLoading, getVelocityData } = useReportData(projectId);

  const forecast = useMemo((): DeliveryForecast => {
    const velocityData = getVelocityData();

    const totalPoints = tasks.reduce((sum, t) => sum + (t.story_points || 0), 0);
    const completedPoints = tasks
      .filter((t) => t.status === "completed")
      .reduce((sum, t) => sum + (t.story_points || 0), 0);
    const remainingPoints = totalPoints - completedPoints;
    const progressPercent = totalPoints > 0 ? Math.round((completedPoints / totalPoints) * 100) : 0;

    // Extract velocities from completed sprints
    const velocities = velocityData.map((v) => v.velocity).filter((v) => v > 0);
    const hasEnoughData = velocities.length >= 2;

    if (!hasEnoughData || remainingPoints <= 0) {
      return {
        projectId,
        totalPoints,
        completedPoints,
        remainingPoints: Math.max(0, remainingPoints),
        progressPercent,
        avgVelocity: 0,
        minVelocity: 0,
        maxVelocity: 0,
        avgSprintDays: 14,
        estimatedOptimistic: null,
        estimatedRealistic: null,
        estimatedPessimistic: null,
        sprintsRemaining: { optimistic: 0, realistic: 0, pessimistic: 0 },
        hasEnoughData,
      };
    }

    const avgVelocity = velocities.reduce((a, b) => a + b, 0) / velocities.length;
    const minVelocity = Math.min(...velocities);
    const maxVelocity = Math.max(...velocities);

    // Calculate average sprint duration in days
    const completedSprints = sprints.filter((s) => s.status === "completed");
    const sprintDurations = completedSprints.map((s) => {
      const start = new Date(s.start_date).getTime();
      const end = new Date(s.end_date).getTime();
      return Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    });
    const avgSprintDays =
      sprintDurations.length > 0
        ? sprintDurations.reduce((a, b) => a + b, 0) / sprintDurations.length
        : 14;

    // Sprints remaining for each scenario
    const sprintsOptimistic = Math.ceil(remainingPoints / maxVelocity);
    const sprintsRealistic = Math.ceil(remainingPoints / avgVelocity);
    const sprintsPessimistic = Math.ceil(remainingPoints / minVelocity);

    const today = new Date();
    const addDays = (d: Date, days: number) => {
      const r = new Date(d);
      r.setDate(r.getDate() + days);
      return r;
    };

    return {
      projectId,
      totalPoints,
      completedPoints,
      remainingPoints,
      progressPercent,
      avgVelocity: Math.round(avgVelocity * 10) / 10,
      minVelocity,
      maxVelocity,
      avgSprintDays: Math.round(avgSprintDays),
      estimatedOptimistic: addDays(today, sprintsOptimistic * avgSprintDays),
      estimatedRealistic: addDays(today, sprintsRealistic * avgSprintDays),
      estimatedPessimistic: addDays(today, sprintsPessimistic * avgSprintDays),
      sprintsRemaining: {
        optimistic: sprintsOptimistic,
        realistic: sprintsRealistic,
        pessimistic: sprintsPessimistic,
      },
      hasEnoughData,
    };
  }, [tasks, sprints, getVelocityData, projectId]);

  return { forecast, isLoading };
}
