// src/database/repositories/DoseRepository.ts
import { getDatabase } from '../database';
import {
  Dose,
  DoseWithMedicine,
  CreateDose,
  DoseStatus,
  MedicineFormat,
  DatabaseError,
} from '../../types';

/**
 * Converte linha do banco para Dose.
 */
function mapRowToDose(row: any): Dose {
  return {
    id: row.id,
    scheduleId: row.schedule_id,
    medicineId: row.medicine_id,
    scheduledTime: row.scheduled_time,
    takenAt: row.taken_at,
    status: row.status as DoseStatus,
  };
}

/**
 * Converte linha com JOIN para DoseWithMedicine.
 */
function mapRowToDoseWithMedicine(row: any): DoseWithMedicine {
  return {
    ...mapRowToDose(row),
    medicineName: row.medicine_name,
    medicineDosage: row.medicine_dosage,
    medicineFormat: row.medicine_format as MedicineFormat,
  };
}

/**
 * Formata data para YYYY-MM-DD (usado em filtros).
 */
function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export const DoseRepository = {
  /**
   * Cria uma nova dose agendada.
   * @returns ID da dose criada
   */
  async create(data: CreateDose): Promise<number> {
    try {
      const db = await getDatabase();
      const result = await db.runAsync(
        `INSERT INTO doses (schedule_id, medicine_id, scheduled_time, taken_at, status)
         VALUES (?, ?, ?, ?, ?)`,
        [
          data.scheduleId,
          data.medicineId,
          data.scheduledTime,
          null,                        // takenAt sempre null ao criar
          DoseStatus.SCHEDULED,        // status sempre SCHEDULED ao criar
        ]
      );
      return Number(result.lastInsertRowId);
    } catch (error) {
      throw new DatabaseError('Erro ao criar dose', error);
    }
  },

  /**
   * Busca uma dose pelo ID.
   */
  async findById(id: number): Promise<Dose | null> {
    try {
      const db = await getDatabase();
      const row = await db.getFirstAsync<any>(
        'SELECT * FROM doses WHERE id = ?',
        [id]
      );
      return row ? mapRowToDose(row) : null;
    } catch (error) {
      throw new DatabaseError(`Erro ao buscar dose ${id}`, error);
    }
  },

  /**
   * Lista todas as doses de uma data específica (YYYY-MM-DD).
   * Ordenadas por horário.
   */
  async findByDate(date: Date): Promise<DoseWithMedicine[]> {
    try {
      const db = await getDatabase();
      const dateStr = formatDate(date);

      const rows = await db.getAllAsync<any>(
        `SELECT
           d.id,
           d.schedule_id,
           d.medicine_id,
           d.scheduled_time,
           d.taken_at,
           d.status,
           m.name AS medicine_name,
           m.dosage AS medicine_dosage,
           m.format AS medicine_format
         FROM doses d
         INNER JOIN medicines m ON m.id = d.medicine_id
         WHERE date(d.scheduled_time) = ?
         ORDER BY d.scheduled_time ASC`,
        [dateStr]
      );

      return rows.map(mapRowToDoseWithMedicine);
    } catch (error) {
      throw new DatabaseError('Erro ao buscar doses por data', error);
    }
  },

  /**
   * Lista doses em um intervalo de datas (para histórico).
   */
  async findByDateRange(
    startDate: Date,
    endDate: Date
  ): Promise<DoseWithMedicine[]> {
    try {
      const db = await getDatabase();
      const start = formatDate(startDate);
      const end = formatDate(endDate);

      const rows = await db.getAllAsync<any>(
        `SELECT
           d.id, d.schedule_id, d.medicine_id, d.scheduled_time,
           d.taken_at, d.status,
           m.name AS medicine_name,
           m.dosage AS medicine_dosage,
           m.format AS medicine_format
         FROM doses d
         INNER JOIN medicines m ON m.id = d.medicine_id
         WHERE date(d.scheduled_time) BETWEEN ? AND ?
         ORDER BY d.scheduled_time DESC`,
        [start, end]
      );

      return rows.map(mapRowToDoseWithMedicine);
    } catch (error) {
      throw new DatabaseError('Erro ao buscar doses por intervalo', error);
    }
  },

  /**
   * Lista todas as doses de um medicamento.
   */
  async findByMedicineId(medicineId: number): Promise<Dose[]> {
    try {
      const db = await getDatabase();
      const rows = await db.getAllAsync<any>(
        'SELECT * FROM doses WHERE medicine_id = ? ORDER BY scheduled_time DESC',
        [medicineId]
      );
      return rows.map(mapRowToDose);
    } catch (error) {
      throw new DatabaseError(
        `Erro ao listar doses do medicamento ${medicineId}`,
        error
      );
    }
  },

  /**
   * Lista doses pendentes (scheduled) até o momento atual.
   * Útil para a tela "Hoje".
   */
  async findPendingUntilNow(): Promise<DoseWithMedicine[]> {
    try {
      const db = await getDatabase();
      const now = new Date().toISOString().replace('T', ' ').slice(0, 19);

      const rows = await db.getAllAsync<any>(
        `SELECT
           d.id, d.schedule_id, d.medicine_id, d.scheduled_time,
           d.taken_at, d.status,
           m.name AS medicine_name,
           m.dosage AS medicine_dosage,
           m.format AS medicine_format
         FROM doses d
         INNER JOIN medicines m ON m.id = d.medicine_id
         WHERE d.status = 'scheduled' AND d.scheduled_time <= ?
         ORDER BY d.scheduled_time ASC`,
        [now]
      );

      return rows.map(mapRowToDoseWithMedicine);
    } catch (error) {
      throw new DatabaseError('Erro ao buscar doses pendentes', error);
    }
  },

  /**
   * Marca uma dose como tomada.
   * @returns true se atualizou
   */
  async markAsTaken(id: number): Promise<boolean> {
    try {
      const db = await getDatabase();
      const now = new Date().toISOString().replace('T', ' ').slice(0, 19);

      const result = await db.runAsync(
        `UPDATE doses SET status = ?, taken_at = ? WHERE id = ?`,
        [DoseStatus.TAKEN, now, id]
      );

      return (result.changes ?? 0) > 0;
    } catch (error) {
      throw new DatabaseError(`Erro ao marcar dose ${id} como tomada`, error);
    }
  },

  /**
   * Marca uma dose como pulada.
   */
  async markAsSkipped(id: number): Promise<boolean> {
    try {
      const db = await getDatabase();
      const now = new Date().toISOString().replace('T', ' ').slice(0, 19);

      const result = await db.runAsync(
        `UPDATE doses SET status = ?, taken_at = ? WHERE id = ?`,
        [DoseStatus.SKIPPED, now, id]
      );

      return (result.changes ?? 0) > 0;
    } catch (error) {
      throw new DatabaseError(`Erro ao marcar dose ${id} como pulada`, error);
    }
  },

  /**
   * Reverte uma dose para o status "scheduled" (desfaz tomada/pulo).
   */
  async unmark(id: number): Promise<boolean> {
    try {
      const db = await getDatabase();
      const result = await db.runAsync(
        `UPDATE doses SET status = ?, taken_at = NULL WHERE id = ?`,
        [DoseStatus.SCHEDULED, id]
      );

      return (result.changes ?? 0) > 0;
    } catch (error) {
      throw new DatabaseError(`Erro ao desmarcar dose ${id}`, error);
    }
  },

  /**
   * Remove uma dose específica.
   */
  async delete(id: number): Promise<boolean> {
    try {
      const db = await getDatabase();
      const result = await db.runAsync('DELETE FROM doses WHERE id = ?', [id]);
      return (result.changes ?? 0) > 0;
    } catch (error) {
      throw new DatabaseError(`Erro ao deletar dose ${id}`, error);
    }
  },
};