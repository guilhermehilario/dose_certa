import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet, Alert,
  ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import type { MedicineFormProps } from '../../types';
import { useTheme } from '../../contexts/ThemeContext';
import { MedicineRepository } from '../../database/repositories/MedicineRepository';
import { ScheduleRepository } from '../../database/repositories/ScheduleRepository';
import { TimePicker } from '../../components/TimePicker';
import { WeekdaySelector } from '../../components/WeekdaySelector';
import type { MedicineFormat } from '../../types';

type ScheduleDraft = {
  tmpId: string;
  time: string;
  weekdays: number[];
};

type FormState = {
  name: string;
  dosage: string;
  format: MedicineFormat | '';
  startDate: string; // YYYY-MM-DD
  endDate: string;
  notes: string;
  schedules: ScheduleDraft[];
};

const FORMATS: { value: MedicineFormat; label: string }[] = [
  { value: 'pill', label: '💊 Comprimido' },
  { value: 'liquid', label: '🧴 Líquido' },
  { value: 'drops', label: '💧 Gotas' },
  { value: 'injection', label: '💉 Injetável' },
  { value: 'other', label: '📦 Outro' },
];

const emptyForm = (): FormState => ({
  name: '', dosage: '', format: '', startDate: '', endDate: '', notes: '',
  schedules: [{ tmpId: crypto.randomUUID(), time: '08:00', weekdays: [] }],
});

const formatDateInput = (raw: string): string => {
  const digits = raw.replace(/\D/g, '').slice(0, 8);
  let out = digits;
  if (digits.length > 4) out = `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
  else if (digits.length > 2) out = `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return out;
};

const parseDate = (display: string): string => {
  // DD/MM/YYYY -> YYYY-MM-DD
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(display);
  if (!m) return '';
  const [, dd, mm, yyyy] = m;
  const d = Number(dd), mo = Number(mm), y = Number(yyyy);
  if (mo < 1 || mo > 12 || d < 1 || d > 31) return '';
  return `${yyyy}-${mm}-${dd}`;
};

const displayDate = (iso: string): string => {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
};

export const MedicineFormScreen: React.FC<MedicineFormProps> = ({ navigation, route }) => {
  const { theme } = useTheme();
  const editingId = route.params?.medicineId;

  const [form, setForm] = useState<FormState>(emptyForm());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(!!editingId);
  const [saving, setSaving] = useState(false);

  const [timePickerVisible, setTimePickerVisible] = useState(false);
  const [activeScheduleIdx, setActiveScheduleIdx] = useState<number | null>(null);

  // Carrega dados ao editar
  useEffect(() => {
    if (!editingId) return;
    (async () => {
      try {
        const m = await MedicineRepository.findById(editingId);
        if (!m) { Alert.alert('Erro', 'Remédio não encontrado.'); navigation.goBack(); return; }
        const scheds = await ScheduleRepository.findByMedicineId(editingId);
        setForm({
          name: m.name,
          dosage: m.dosage ?? '',
          format: (m.format as MedicineFormat) ?? '',
          startDate: displayDate(m.start_date ?? ''),
          endDate: displayDate(m.end_date ?? ''),
          notes: m.notes ?? '',
          schedules: scheds.length
            ? scheds.map((s) => ({ tmpId: crypto.randomUUID(), time: s.time, weekdays: s.weekdays }))
            : [{ tmpId: crypto.randomUUID(), time: '08:00', weekdays: [] }],
        });
      } finally {
        setLoading(false);
      }
    })();
  }, [editingId, navigation]);

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => { const n = { ...e }; delete n[key]; return n; });
  };

  const addSchedule = () => {
    update('schedules', [...form.schedules, { tmpId: crypto.randomUUID(), time: '08:00', weekdays: [] }]);
  };

  const removeSchedule = (idx: number) => {
    if (form.schedules.length <= 1) {
      Alert.alert('Atenção', 'Deve haver pelo menos um horário.');
      return;
    }
    update('schedules', form.schedules.filter((_, i) => i !== idx));
  };

  const updateSchedule = (idx: number, patch: Partial<ScheduleDraft>) => {
    const next = form.schedules.map((s, i) => (i === idx ? { ...s, ...patch } : s));
    update('schedules', next);
  };

  const openTimePicker = (idx: number) => {
    setActiveScheduleIdx(idx);
    setTimePickerVisible(true);
  };

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Nome é obrigatório';
    if (!form.startDate.trim()) e.startDate = 'Data de início é obrigatória';
    else if (!parseDate(form.startDate)) e.startDate = 'Data inválida (use DD/MM/AAAA)';
    if (form.endDate.trim() && !parseDate(form.endDate)) e.endDate = 'Data inválida';
    if (form.schedules.length === 0) e.schedules = 'Adicione pelo menos um horário';
    form.schedules.forEach((s, i) => {
      if (s.weekdays.length === 0) e[`sched_${i}`] = 'Selecione ao menos um dia';
    });
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        dosage: form.dosage.trim() || undefined,
        format: (form.format || undefined) as MedicineFormat | undefined,
        start_date: parseDate(form.startDate),
        end_date: form.endDate ? parseDate(form.endDate) : undefined,
        notes: form.notes.trim() || undefined,
      };

      if (editingId) {
        await MedicineRepository.update(editingId, payload);
        await ScheduleRepository.deleteByMedicineId(editingId);
        for (const s of form.schedules) {
          await ScheduleRepository.create({ medicine_id: editingId, time: s.time, weekdays: s.weekdays });
        }
      } else {
        const id = await MedicineRepository.create(payload);
        for (const s of form.schedules) {
          await ScheduleRepository.create({ medicine_id: id, time: s.time, weekdays: s.weekdays });
        }
      }
      navigation.goBack();
    } catch (err) {
      Alert.alert('Erro', 'Não foi possível salvar o remédio.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={[styles.label, { color: theme.colors.text }]}>Nome *</Text>
        <TextInput
          value={form.name}
          onChangeText={(v) => update('name', v)}
          placeholder="Ex: Dipirona"
          placeholderTextColor={theme.colors.textSecondary}
          style={[styles.input, { backgroundColor: theme.colors.surface, color: theme.colors.text, borderColor: errors.name ? theme.colors.danger : theme.colors.border }]}
        />
        {errors.name ? <Text style={[styles.errorText, { color: theme.colors.danger }]}>{errors.name}</Text> : null}

        <Text style={[styles.label, { color: theme.colors.text }]}>Dosagem</Text>
        <TextInput
          value={form.dosage}
          onChangeText={(v) => update('dosage', v)}
          placeholder="Ex: 500mg"
          placeholderTextColor={theme.colors.textSecondary}
          style={[styles.input, { backgroundColor: theme.colors.surface, color: theme.colors.text, borderColor: theme.colors.border }]}
        />

        <Text style={[styles.label, { color: theme.colors.text }]}>Formato</Text>
        <View style={styles.formatRow}>
          {FORMATS.map((f) => {
            const active = form.format === f.value;
            return (
              <TouchableOpacity
                key={f.value}
                onPress={() => update('format', active ? '' : f.value)}
                style={[
                  styles.formatChip,
                  {
                    backgroundColor: active ? theme.colors.primary : theme.colors.surface,
                    borderColor: active ? theme.colors.primary : theme.colors.border,
                  },
                ]}
              >
                <Text style={{ color: active ? '#fff' : theme.colors.text, fontSize: 13 }}>{f.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.row2}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.label, { color: theme.colors.text }]}>Data início *</Text>
            <TextInput
              value={form.startDate}
              onChangeText={(v) => update('startDate', formatDateInput(v))}
              placeholder="DD/MM/AAAA"
              placeholderTextColor={theme.colors.textSecondary}
              keyboardType="numeric"
              maxLength={10}
              style={[styles.input, { backgroundColor: theme.colors.surface, color: theme.colors.text, borderColor: errors.startDate ? theme.colors.danger : theme.colors.border }]}
            />
            {errors.startDate ? <Text style={[styles.errorText, { color: theme.colors.danger }]}>{errors.startDate}</Text> : null}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.label, { color: theme.colors.text }]}>Data fim</Text>
            <TextInput
              value={form.endDate}
              onChangeText={(v) => update('endDate', formatDateInput(v))}
              placeholder="DD/MM/AAAA"
              placeholderTextColor={theme.colors.textSecondary}
              keyboardType="numeric"
              maxLength={10}
              style={[styles.input, { backgroundColor: theme.colors.surface, color: theme.colors.text, borderColor: errors.endDate ? theme.colors.danger : theme.colors.border }]}
            />
            {errors.endDate ? <Text style={[styles.errorText, { color: theme.colors.danger }]}>{errors.endDate}</Text> : null}
          </View>
        </View>

        <Text style={[styles.label, { color: theme.colors.text }]}>Observações</Text>
        <TextInput
          value={form.notes}
          onChangeText={(v) => update('notes', v)}
          placeholder="Ex: Tomar após refeição"
          placeholderTextColor={theme.colors.textSecondary}
          multiline
          numberOfLines={3}
          style={[styles.input, styles.textarea, { backgroundColor: theme.colors.surface, color: theme.colors.text, borderColor: theme.colors.border }]}
        />

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Horários *</Text>
          <TouchableOpacity onPress={addSchedule}>
            <Text style={{ color: theme.colors.primary, fontWeight: '600' }}>+ Adicionar</Text>
          </TouchableOpacity>
        </View>
        {errors.schedules ? <Text style={[styles.errorText, { color: theme.colors.danger }]}>{errors.schedules}</Text> : null}

        {form.schedules.map((s, idx) => (
          <View key={s.tmpId} style={[styles.scheduleBlock, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <View style={styles.scheduleTop}>
              <TouchableOpacity
                onPress={() => openTimePicker(idx)}
                style={[styles.timeBtn, { borderColor: theme.colors.border }]}
              >
                <Text style={[styles.timeValue, { color: theme.colors.primary }]}>{s.time}</Text>
                <Text style={{ color: theme.colors.textSecondary, fontSize: 12 }}>alterar</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => removeSchedule(idx)} style={styles.removeBtn}>
                <Text style={{ color: theme.colors.danger, fontSize: 20 }}>×</Text>
              </TouchableOpacity>
            </View>

            <Text style={[styles.miniLabel, { color: theme.colors.textSecondary }]}>Dias da semana</Text>
            <WeekdaySelector
              selected={s.weekdays}
              onChange={(days) => updateSchedule(idx, { weekdays: days })}
              error={errors[`sched_${idx}`]}
            />
          </View>
        ))}

        <TouchableOpacity
          onPress={handleSave}
          disabled={saving}
          style={[styles.saveBtn, { backgroundColor: theme.colors.primary, opacity: saving ? 0.6 : 1 }]}
        >
          {saving
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.saveBtnText}>{editingId ? 'Salvar alterações' : 'Cadastrar remédio'}</Text>}
        </TouchableOpacity>
      </ScrollView>

      {activeScheduleIdx !== null && (
        <TimePicker
          visible={timePickerVisible}
          initialTime={form.schedules[activeScheduleIdx]?.time}
          onConfirm={(t) => {
            updateSchedule(activeScheduleIdx, { time: t });
            setTimePickerVisible(false);
            setActiveScheduleIdx(null);
          }}
          onCancel={() => {
            setTimePickerVisible(false);
            setActiveScheduleIdx(null);
          }}
        />
      )}
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 40 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 14, fontWeight: '600', marginTop: 14, marginBottom: 6 },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15 },
  textarea: { minHeight: 80, textAlignVertical: 'top' },
  errorText: { fontSize: 12, marginTop: 4 },
  row2: { flexDirection: 'row', gap: 12 },
  formatRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  formatChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, borderWidth: 1 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 22, marginBottom: 8 },
  sectionTitle: { fontSize: 16, fontWeight: '700' },
  scheduleBlock: { borderRadius: 12, padding: 14, borderWidth: 1, marginBottom: 12 },
  scheduleTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  timeBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8 },
  timeValue: { fontSize: 22, fontWeight: '700', fontVariant: ['tabular-nums'] },
  removeBtn: { padding: 6 },
  miniLabel: { fontSize: 12, marginBottom: 6, marginTop: 4 },
  saveBtn: { marginTop: 24, paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});