"use client";

import type { ReactNode } from "react";

export type QuizOptionState =
  | "idle"
  | "selected"
  | "correct"
  | "incorrect"
  | "partial"
  | "disabled"
  | "revealed";

export type QuizOptionKind = "single" | "multiple" | "neutral";

export interface QuizOptionViewModel {
  id: string;
  label?: ReactNode;
  content: ReactNode;
  description?: ReactNode;
  feedback?: ReactNode;
  state?: QuizOptionState;
  disabled?: boolean;
}

