// src/database/repositories/ScheduleRepository.ts
import { getDatabase } from '../database';
import {
  Schedule,
  CreateSchedule,
  DatabaseError,
} from '../../types';

/**
 * Converte linha do banco para Schedule.
 * weekdays vem como string JSON e é convertido para number[].
 */
function mapRowToSchedule(row: any): Schedule {
  return {
    id: row.id,
    medicineId: row.medicine_id,
    time: row.time,
    weekdays: JSON.parse(row.weekdays) as number[],
    notificationId: row.notification_id,
  };
}

export const ScheduleRepository = {
  /**
   * Cria um novo agendamento.
   * @returns ID do agendamento criado
   */
  async create(data: CreateSchedule): Promise<number> {
    try {
      const db = await getDatabase();
      const weekdaysJson = JSON.stringify(data.weekdays);

      const result = await db.runAsync(
        `INSERT INTO schedules (medicine_id, time, weekdays, notification_id)
         VALUES (?, ?, ?, ?)`,
        [data.medicineId, data.time, weekdaysJson, null]
      );

      return Number(result.lastInsertRowId);
    } catch (error) {
      throw new DatabaseError('Erro ao criar agendamento', error);
    }
  },

  /**
   * Busca um agendamento pelo ID.
   */
  async findById(id: number): Promise<Schedule | null> {
    try {
      const db = await getDatabase();
      const row = await db.getFirstAsync<any>(
        'SELECT * FROM schedules WHERE id = ?',
        [id]
      );
      return row ? mapRowToSchedule(row) : null;
    } catch (error) {
      throw new DatabaseError(`Erro ao buscar agendamento ${id}`, error);
    }
  },

  /**
   * Lista todos os agendamentos de um medicamento.
   */
  async findByMedicineId(medicineId: number): Promise<Schedule[]> {
    try {
      const db = await getDatabase();
      const rows = await db.getAllAsync<any>(
        'SELECT * FROM schedules WHERE medicine_id = ? ORDER BY time ASC',
        [medicineId]
      );
      return rows.map(mapRowToSchedule);
    } catch (error) {
      throw new DatabaseError(
        `Erro ao listar agendamentos do medicamento ${medicineId}`,
        error
      );
    }
  },

  /**
   * Lista todos os agendamentos do banco.
   */
  async findAll(): Promise<Schedule[]> {
    try {
      const db = await getDatabase();
      const rows = await db.getAllAsync<any>(
        'SELECT * FROM schedules ORDER BY time ASC'
      );
      return rows.map(mapRowToSchedule);
    } catch (error) {
      throw new DatabaseError('Erro ao listar agendamentos', error);
    }
  },

  /**
   * Atualiza o ID da notificação local associada ao agendamento.
   */
  async updateNotificationId(
    scheduleId: number,
    notificationId: string
  ): Promise<boolean> {
    try {
      const db = await getDatabase();
      const result = await db.runAsync(
        'UPDATE schedules SET notification_id = ? WHERE id = ?',
        [notificationId, scheduleId]
      );
      return (result.changes ?? 0) > 0;
    } catch (error) {
      throw new DatabaseError(
        `Erro ao atualizar notification_id do agendamento ${scheduleId}`,
        error
      );
    }
  },

  /**
   * Remove um agendamento.
   * CASCADE remove doses associadas.
   */
  async delete(id: number): Promise<boolean> {
    try {
      const db = await getDatabase();
      const result = await db.runAsync('DELETE FROM schedules WHERE id = ?', [id]);
      return (result.changes ?? 0) > 0;
    } catch (error) {
      throw new DatabaseError(`Erro ao deletar agendamento ${id}`, error);
    }
  },

  /**
   * Remove todos os agendamentos de um medicamento.
   */
  async deleteByMedicineId(medicineId: number): Promise<number> {
    try {
      const db = await getDatabase();
      const result = await db.runAsync(
        'DELETE FROM schedules WHERE medicine_id = ?',
        [medicineId]
      );
      return result.changes ?? 0;
    } catch (error) {
      throw new DatabaseError(
        `Erro ao deletar agendamentos do medicamento ${medicineId}`,
        error
      );
    }
  },
};