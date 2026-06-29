import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TextInput, TouchableOpacity, Alert,
  ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import type { CreateMedicine, MedicineFormProps } from '../../../types';
import { MedicineFormat } from '../../../types';
import { useTheme } from '../../../contexts/ThemeContext';
import { MedicineRepository } from '../../../database/repositories/MedicineRepository';
import { ScheduleRepository } from '../../../database/repositories/ScheduleRepository';
import { TimePicker } from '../components/TimePicker';
import { WeekdaySelector } from '../components/WeekdaySelector';
import { globalStyles } from '../../../constants/globalStyles';

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
  { value: MedicineFormat.TABLET, label: '💊 Comprimido' },
  { value: MedicineFormat.CAPSULE, label: '💊 Cápsula' },
  { value: MedicineFormat.LIQUID, label: '🧴 Líquido' },
  { value: MedicineFormat.DROPS, label: '💧 Gotas' },
  { value: MedicineFormat.INJECTION, label: '💉 Injetável' },
  { value: MedicineFormat.CREAM, label: '🧴 Creme' },
  { value: MedicineFormat.OTHER, label: '📦 Outro' },
];

const createTmpId = (): string => `schedule-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

const emptyForm = (): FormState => ({
  name: '', dosage: '', format: '', startDate: '', endDate: '', notes: '',
  schedules: [{ tmpId: createTmpId(), time: '08:00', weekdays: [] }],
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
  const theme = useTheme();
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
          startDate: displayDate(m.startDate ?? ''),
          endDate: displayDate(m.endDate ?? ''),
          notes: m.notes ?? '',
          schedules: scheds.length
            ? scheds.map((s) => ({ tmpId: createTmpId(), time: s.time, weekdays: s.weekdays }))
            : [{ tmpId: createTmpId(), time: '08:00', weekdays: [] }],
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
    update('schedules', [...form.schedules, { tmpId: createTmpId(), time: '08:00', weekdays: [] }]);
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
    if (!form.format) e.format = 'Formato é obrigatório';
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
      const payload: CreateMedicine = {
        name: form.name.trim(),
        dosage: form.dosage.trim(),
        format: form.format as MedicineFormat,
        startDate: parseDate(form.startDate),
        endDate: form.endDate ? parseDate(form.endDate) : null,
        notes: form.notes.trim() || null,
      };

      if (editingId) {
        await MedicineRepository.update(editingId, payload);
        await ScheduleRepository.deleteByMedicineId(editingId);
        for (const s of form.schedules) {
          await ScheduleRepository.create({ medicineId: editingId, time: s.time, weekdays: s.weekdays });
        }
      } else {
        const id = await MedicineRepository.create(payload);
        for (const s of form.schedules) {
          await ScheduleRepository.create({ medicineId: id, time: s.time, weekdays: s.weekdays });
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
      <View style={[globalStyles.center, { backgroundColor: theme.colors.background }]}> 
        <ActivityIndicator color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={globalStyles.content} keyboardShouldPersistTaps="handled">
        <Text style={[globalStyles.label, { color: theme.colors.text }]}>Nome *</Text>
        <TextInput
          value={form.name}
          onChangeText={(v) => update('name', v)}
          placeholder="Ex: Dipirona"
          placeholderTextColor={theme.colors.textSecondary}
          style={[globalStyles.input, { backgroundColor: theme.colors.surface, color: theme.colors.text, borderColor: errors.name ? theme.colors.danger : theme.colors.border }]}
        />
        {errors.name ? <Text style={[globalStyles.errorText, { color: theme.colors.danger }]}>{errors.name}</Text> : null}

        <Text style={[globalStyles.label, { color: theme.colors.text }]}>Dosagem</Text>
        <TextInput
          value={form.dosage}
          onChangeText={(v) => update('dosage', v)}
          placeholder="Ex: 500mg"
          placeholderTextColor={theme.colors.textSecondary}
          style={[globalStyles.input, { backgroundColor: theme.colors.surface, color: theme.colors.text, borderColor: theme.colors.border }]}
        />

        <Text style={[globalStyles.label, { color: theme.colors.text }]}>Formato</Text>
        <View style={globalStyles.formatRow}>
          {FORMATS.map((f) => {
            const active = form.format === f.value;
            return (
              <TouchableOpacity
                key={f.value}
                onPress={() => update('format', active ? '' : f.value)}
                style={[
                  globalStyles.formatChip,
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

        <View style={globalStyles.row2}>
          <View style={{ flex: 1 }}>
            <Text style={[globalStyles.label, { color: theme.colors.text }]}>Data início *</Text>
            <TextInput
              value={form.startDate}
              onChangeText={(v) => update('startDate', formatDateInput(v))}
              placeholder="DD/MM/AAAA"
              placeholderTextColor={theme.colors.textSecondary}
              keyboardType="numeric"
              maxLength={10}
              style={[globalStyles.input, { backgroundColor: theme.colors.surface, color: theme.colors.text, borderColor: errors.startDate ? theme.colors.danger : theme.colors.border }]}
            />
            {errors.startDate ? <Text style={[globalStyles.errorText, { color: theme.colors.danger }]}>{errors.startDate}</Text> : null}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[globalStyles.label, { color: theme.colors.text }]}>Data fim</Text>
            <TextInput
              value={form.endDate}
              onChangeText={(v) => update('endDate', formatDateInput(v))}
              placeholder="DD/MM/AAAA"
              placeholderTextColor={theme.colors.textSecondary}
              keyboardType="numeric"
              maxLength={10}
              style={[globalStyles.input, { backgroundColor: theme.colors.surface, color: theme.colors.text, borderColor: errors.endDate ? theme.colors.danger : theme.colors.border }]}
            />
            {errors.endDate ? <Text style={[globalStyles.errorText, { color: theme.colors.danger }]}>{errors.endDate}</Text> : null}
          </View>
        </View>

        <Text style={[globalStyles.label, { color: theme.colors.text }]}>Observações</Text>
        <TextInput
          value={form.notes}
          onChangeText={(v) => update('notes', v)}
          placeholder="Ex: Tomar após refeição"
          placeholderTextColor={theme.colors.textSecondary}
          multiline
          numberOfLines={3}
          style={[globalStyles.input, globalStyles.textarea, { backgroundColor: theme.colors.surface, color: theme.colors.text, borderColor: theme.colors.border }]}
        />

        <View style={globalStyles.sectionHeader}>
          <Text style={[globalStyles.sectionTitle, { color: theme.colors.text }]}>Horários *</Text>
          <TouchableOpacity onPress={addSchedule}>
            <Text style={{ color: theme.colors.primary, fontWeight: '600' }}>+ Adicionar</Text>
          </TouchableOpacity>
        </View>
        {errors.schedules ? <Text style={[globalStyles.errorText, { color: theme.colors.danger }]}>{errors.schedules}</Text> : null}

        {form.schedules.map((s, idx) => (
          <View key={s.tmpId} style={[globalStyles.scheduleBlock, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <View style={globalStyles.scheduleTop}>
              <TouchableOpacity
                onPress={() => openTimePicker(idx)}
                style={[globalStyles.timeBtn, { borderColor: theme.colors.border }]}
              >
                <Text style={[globalStyles.timeValue, { color: theme.colors.primary }]}>{s.time}</Text>
                <Text style={{ color: theme.colors.textSecondary, fontSize: 12 }}>alterar</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => removeSchedule(idx)} style={globalStyles.removeBtn}>
                <Text style={{ color: theme.colors.danger, fontSize: 20 }}>×</Text>
              </TouchableOpacity>
            </View>

            <Text style={[globalStyles.miniLabel, { color: theme.colors.textSecondary }]}>Dias da semana</Text>
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
          style={[globalStyles.saveBtn, { backgroundColor: theme.colors.primary, opacity: saving ? 0.6 : 1 }]}
        >
          {saving
            ? <ActivityIndicator color="#fff" />
            : <Text style={globalStyles.saveBtnText}>{editingId ? 'Salvar alterações' : 'Cadastrar remédio'}</Text>}
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

