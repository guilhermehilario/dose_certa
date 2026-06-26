// src/database/repositories/MedicineRepository.ts
import { getDatabase } from '../database';
import {
  Medicine,
  CreateMedicine,
  UpdateMedicine,
  MedicineFormat,
  DatabaseError,
} from '../../types';

/**
 * Converte uma linha do banco (snake_case) para o objeto Medicine (camelCase).
 */
function mapRowToMedicine(row: any): Medicine {
  return {
    id: row.id,
    name: row.name,
    dosage: row.dosage,
    format: row.format as MedicineFormat,
    startDate: row.start_date,
    endDate: row.end_date,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const MedicineRepository = {
  /**
   * Cria um novo medicamento.
   * @returns ID do medicamento criado
   */
  async create(data: CreateMedicine): Promise<number> {
    try {
      const db = await getDatabase();
      const now = new Date().toISOString().replace('T', ' ').slice(0, 19);

      const result = await db.runAsync(
        `INSERT INTO medicines (name, dosage, format, start_date, end_date, notes, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          data.name,
          data.dosage,
          data.format,
          data.startDate,
          data.endDate,
          data.notes,
          now,
          now,
        ]
      );

      return Number(result.lastInsertRowId);
    } catch (error) {
      throw new DatabaseError('Erro ao criar medicamento', error);
    }
  },

  /**
   * Busca um medicamento pelo ID.
   * @returns Medicine ou null se não encontrado
   */
  async findById(id: number): Promise<Medicine | null> {
    try {
      const db = await getDatabase();
      const row = await db.getFirstAsync<any>(
        'SELECT * FROM medicines WHERE id = ?',
        [id]
      );
      return row ? mapRowToMedicine(row) : null;
    } catch (error) {
      throw new DatabaseError(`Erro ao buscar medicamento ${id}`, error);
    }
  },

  /**
   * Lista todos os medicamentos ordenados por nome.
   */
  async findAll(): Promise<Medicine[]> {
    try {
      const db = await getDatabase();
      const rows = await db.getAllAsync<any>(
        'SELECT * FROM medicines ORDER BY name ASC'
      );
      return rows.map(mapRowToMedicine);
    } catch (error) {
      throw new DatabaseError('Erro ao listar medicamentos', error);
    }
  },

  /**
   * Atualiza campos de um medicamento.
   * @returns true se alguma linha foi atualizada
   */
  async update(id: number, data: UpdateMedicine): Promise<boolean> {
    try {
      const db = await getDatabase();
      const fields: string[] = [];
      const values: any[] = [];

      const fieldMap: Record<string, string> = {
        name: 'name',
        dosage: 'dosage',
        format: 'format',
        startDate: 'start_date',
        endDate: 'end_date',
        notes: 'notes',
      };

      for (const [key, column] of Object.entries(fieldMap)) {
        if (key in data) {
          fields.push(`${column} = ?`);
          values.push((data as any)[key]);
        }
      }

      if (fields.length === 0) return false;

      fields.push(`updated_at = ?`);
      values.push(new Date().toISOString().replace('T', ' ').slice(0, 19));
      values.push(id);

      const result = await db.runAsync(
        `UPDATE medicines SET ${fields.join(', ')} WHERE id = ?`,
        values
      );

      return (result.changes ?? 0) > 0;
    } catch (error) {
      throw new DatabaseError(`Erro ao atualizar medicamento ${id}`, error);
    }
  },

  /**
   * Remove um medicamento.
   * CASCADE remove schedules e doses associados automaticamente.
   * @returns true se foi removido
   */
  async delete(id: number): Promise<boolean> {
    try {
      const db = await getDatabase();
      const result = await db.runAsync('DELETE FROM medicines WHERE id = ?', [id]);
      return (result.changes ?? 0) > 0;
    } catch (error) {
      throw new DatabaseError(`Erro ao deletar medicamento ${id}`, error);
    }
  },
};