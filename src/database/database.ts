// src/database/database.ts
import * as SQLite from 'expo-sqlite';
import { DatabaseError } from '../types';

const DB_NAME = 'medicines.db';

let dbInstance: SQLite.SQLiteDatabase | null = null;

/**
 * Retorna a instância única do banco de dados (singleton).
 * Inicializa o SQLite e cria as tabelas na primeira chamada.
 */
export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (dbInstance) return dbInstance;

  try {
    dbInstance = SQLite.openDatabaseSync(DB_NAME);
    await initializeTables(dbInstance);
    return dbInstance;
  } catch (error) {
    throw new DatabaseError('Falha ao abrir o banco de dados', error);
  }
}

/**
 * Cria as tabelas do schema caso ainda não existam.
 * Usa IF NOT EXISTS para ser idempotente.
 */
async function initializeTables(db: SQLite.SQLiteDatabase): Promise<void> {
  try {
    // Habilita foreign keys (desabilitadas por padrão no SQLite)
    await db.execAsync('PRAGMA foreign_keys = ON;');

    await db.execAsync(`
      -- ==========================================
      -- TABELA: medicines
      -- Armazena os medicamentos cadastrados
      -- ==========================================
      CREATE TABLE IF NOT EXISTS medicines (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        name        TEXT    NOT NULL,
        dosage      TEXT    NOT NULL,
        format      TEXT    NOT NULL CHECK(format IN (
                          'tablet','capsule','liquid','drops','injection','cream','other'
                        )),
        start_date  TEXT    NOT NULL,
        end_date    TEXT,
        notes       TEXT,
        created_at  TEXT    NOT NULL DEFAULT (datetime('now','localtime')),
        updated_at  TEXT    NOT NULL DEFAULT (datetime('now','localtime'))
      );

      -- ==========================================
      -- TABELA: schedules
      -- Horários de administração de cada medicamento
      -- weekdays armazenado como JSON (ex: "[1,2,3,4,5]")
      -- ==========================================
      CREATE TABLE IF NOT EXISTS schedules (
        id              INTEGER PRIMARY KEY AUTOINCREMENT,
        medicine_id     INTEGER NOT NULL,
        time            TEXT    NOT NULL,
        weekdays        TEXT    NOT NULL,
        notification_id TEXT,
        FOREIGN KEY (medicine_id)
          REFERENCES medicines(id) ON DELETE CASCADE
      );

      -- ==========================================
      -- TABELA: doses
      -- Instâncias de doses (uma por horário/dia)
      -- ==========================================
      CREATE TABLE IF NOT EXISTS doses (
        id              INTEGER PRIMARY KEY AUTOINCREMENT,
        schedule_id     INTEGER NOT NULL,
        medicine_id     INTEGER NOT NULL,
        scheduled_time  TEXT    NOT NULL,
        taken_at        TEXT,
        status          TEXT    NOT NULL DEFAULT 'scheduled'
                              CHECK(status IN ('scheduled','taken','skipped','missed')),
        FOREIGN KEY (schedule_id)
          REFERENCES schedules(id) ON DELETE CASCADE,
        FOREIGN KEY (medicine_id)
          REFERENCES medicines(id) ON DELETE CASCADE
      );

      -- ==========================================
      -- ÍNDICES para performance nas queries mais comuns
      -- ==========================================
      CREATE INDEX IF NOT EXISTS idx_schedules_medicine
        ON schedules(medicine_id);

      CREATE INDEX IF NOT EXISTS idx_doses_schedule
        ON doses(schedule_id);

      CREATE INDEX IF NOT EXISTS idx_doses_medicine
        ON doses(medicine_id);

      CREATE INDEX IF NOT EXISTS idx_doses_scheduled_time
        ON doses(scheduled_time);
    `);

    console.log('✅ Banco de dados inicializado com sucesso');
  } catch (error) {
    throw new DatabaseError('Falha ao criar tabelas do banco', error);
  }
}

/**
 * Fecha a conexão com o banco (útil em testes ou logout).
 */
export async function closeDatabase(): Promise<void> {
  if (dbInstance) {
    await dbInstance.closeAsync();
    dbInstance = null;
  }
}