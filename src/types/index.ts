// src/types/index.ts
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

// ============================================
// ENUMS
// ============================================

/** Formato do medicamento */
export enum MedicineFormat {
  TABLET = 'tablet',         // Comprimido
  CAPSULE = 'capsule',       // Cápsula
  LIQUID = 'liquid',         // Líquido (xarope, solução)
  DROPS = 'drops',           // Gotas
  INJECTION = 'injection',   // Injeção
  CREAM = 'cream',           // Creme/Pomada
  OTHER = 'other',           // Outro
}

/** Status de uma dose administrada */
export enum DoseStatus {
  SCHEDULED = 'scheduled', // Agendada (ainda não tomada)
  TAKEN = 'taken',         // Tomada
  SKIPPED = 'skipped',     // Pulada
  MISSED = 'missed',       // Perdida (passou do horário)
}

// ============================================
// ENTIDADES (formato do banco)
// ============================================

/** Medicamento cadastrado */
export interface Medicine {
  id: number;
  name: string;
  dosage: string;           // Ex: "500mg", "10ml", "1 gota"
  format: MedicineFormat;
  startDate: string;        // ISO: YYYY-MM-DD
  endDate: string | null;   // null = uso contínuo
  notes: string | null;
  createdAt: string;        // ISO datetime
  updatedAt: string;        // ISO datetime
}

/** Dados para criação de um medicamento (sem id/datas) */
export type CreateMedicine = Omit<Medicine, 'id' | 'createdAt' | 'updatedAt'>;

/** Dados para atualização parcial de um medicamento */
export type UpdateMedicine = Partial<CreateMedicine>;

/** Horário de administração do medicamento */
export interface Schedule {
  id: number;
  medicineId: number;
  time: string;             // HH:MM (24h)
  weekdays: number[];       // 0=Dom, 1=Seg ... 6=Sáb
  notificationId: string | null; // ID da notificação local agendada
}

export type MedicinesStackParamList = {
  MedicinesList: undefined;
  MedicineDetails: { medicineId: number };
  MedicineForm: { medicineId?: number };
};


/** Dados para criação de um agendamento */
export type CreateSchedule = Omit<Schedule, 'id' | 'notificationId'>;

/** Dose individual (instância de um agendamento em uma data) */
export interface Dose {
  id: number;
  scheduleId: number;
  medicineId: number;
  scheduledTime: string;    // ISO datetime completo
  takenAt: string | null;   // ISO datetime de quando foi tomada
  status: DoseStatus;
}

/** Dados para criação de uma dose */
export type CreateDose = Omit<Dose, 'id' | 'takenAt' | 'status'>;

// ============================================
// TIPOS DE RESPOSTA (com informações join)
// ============================================

/** Dose com dados do medicamento associado (para exibição) */
export interface DoseWithMedicine extends Dose {
  medicineName: string;
  medicineDosage: string;
  medicineFormat: MedicineFormat;
}

// ============================================
// ERROS CUSTOMIZADOS
// ============================================

export class DatabaseError extends Error {
  constructor(message: string, public cause?: unknown) {
    super(message);
    this.name = 'DatabaseError';
  }
}

export type MedicineDetailsProps = NativeStackScreenProps<MedicinesStackParamList, 'MedicineDetails'>;
export type MedicineFormProps = NativeStackScreenProps<MedicinesStackParamList, 'MedicineForm'>;