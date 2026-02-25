// 생년월일+시간 입력 UI (Client Component)
// 'use client' 필요: input onChange 이벤트 핸들러, 체크박스 상태 관리
// 온보딩(Task 2)과 궁합 플로우(Task 5)에서 재사용
//
// 사주 계산에 필요한 입력값:
// - 생년월일: 일주(日柱) 계산에 필수
// - 태어난 시간: 시주(時柱) 계산에 사용, 모르면 생략 가능
'use client'

// ===== 타입 및 헬퍼 함수 =====

/** 생년월일 입력값 구조 */
export interface BirthDateValue {
  year: string
  month: string
  day: string
  hour: string
  /** 태어난 시간을 모르는 경우 true - 시주 계산 생략 */
  unknownTime: boolean
}

/** 빈 초기값 생성 */
export function getEmptyBirthDate(): BirthDateValue {
  return { year: '', month: '', day: '', hour: '', unknownTime: false }
}

/**
 * YYYY-MM-DD 형식 문자열 변환 (DB 저장용)
 * 년/월/일 중 하나라도 비어있으면 null 반환
 */
export function toBirthDateString(value: BirthDateValue): string | null {
  const { year, month, day } = value
  if (!year || !month || !day) return null

  const y = year.padStart(4, '0')
  const m = month.padStart(2, '0')
  const d = day.padStart(2, '0')
  return `${y}-${m}-${d}`
}

/**
 * HH:00 형식 문자열 변환 (DB 저장용)
 * 시간을 모르거나 비어있으면 null 반환
 */
export function toBirthTimeString(value: BirthDateValue): string | null {
  if (value.unknownTime || !value.hour) return null
  return `${value.hour.padStart(2, '0')}:00`
}

// ===== 미리보기 데이터 타입 =====

interface BirthPreview {
  /** 사주 일주 라벨 (예: "갑자") */
  dayPillar?: string
  /** 별자리 이름 (예: "사자자리") */
  zodiacSign?: string
  /** 별자리 이모지 (예: "♌") */
  zodiacEmoji?: string
}

// ===== 컴포넌트 =====

interface BirthDateInputProps {
  value: BirthDateValue
  onChange: (value: BirthDateValue) => void
  /** true이면 미리보기 영역 표시 */
  showPreview?: boolean
  /** 서버에서 계산된 미리보기 데이터 */
  preview?: BirthPreview | null
}

export function BirthDateInput({
  value,
  onChange,
  showPreview = false,
  preview,
}: BirthDateInputProps) {
  // 개별 필드 변경 핸들러를 매번 새로 만들지 않아도 되지만,
  // 컴포넌트가 단순하므로 인라인으로 처리
  const updateField = (
    field: keyof BirthDateValue,
    fieldValue: string | boolean
  ) => {
    onChange({ ...value, [field]: fieldValue })
  }

  return (
    <div className="space-y-4">
      {/* 생년월일 입력 */}
      <div className="grid grid-cols-3 gap-2">
        <NumberField
          label="년"
          value={value.year}
          onChange={(v) => updateField('year', v)}
          placeholder="1990"
          maxLength={4}
        />
        <NumberField
          label="월"
          value={value.month}
          onChange={(v) => updateField('month', v)}
          placeholder="1"
          maxLength={2}
        />
        <NumberField
          label="일"
          value={value.day}
          onChange={(v) => updateField('day', v)}
          placeholder="1"
          maxLength={2}
        />
      </div>

      {/* 태어난 시간 입력 */}
      <div className="space-y-2">
        <div className="grid grid-cols-3 gap-2">
          <NumberField
            label="시"
            value={value.hour}
            onChange={(v) => updateField('hour', v)}
            placeholder="0"
            maxLength={2}
            disabled={value.unknownTime}
          />
        </div>

        {/* 시간 모름 체크박스 */}
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={value.unknownTime}
            onChange={(e) => updateField('unknownTime', e.target.checked)}
            className="w-4 h-4 rounded border-destiny-border bg-destiny-surface accent-destiny-primary"
          />
          <span className="text-sm text-destiny-text-muted">
            태어난 시간을 몰라요
          </span>
        </label>
      </div>

      {/* 미리보기: 입력한 생년월일로 계산된 사주 일주/별자리 */}
      {showPreview && preview && (preview.dayPillar || preview.zodiacSign) && (
        <div className="rounded-xl bg-destiny-surface-2/50 border border-destiny-border/50 p-3 space-y-1">
          {preview.dayPillar && (
            <p className="text-sm text-destiny-text-muted">
              <span className="text-destiny-primary font-medium">일주</span>{' '}
              {preview.dayPillar}
            </p>
          )}
          {preview.zodiacSign && (
            <p className="text-sm text-destiny-text-muted">
              <span className="text-destiny-primary font-medium">별자리</span>{' '}
              {preview.zodiacEmoji} {preview.zodiacSign}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

// ===== 숫자 입력 필드 (내부 전용) =====

interface NumberFieldProps {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder: string
  maxLength: number
  disabled?: boolean
}

// 숫자만 입력 가능한 필드 - 년/월/일/시 각각에 사용
function NumberField({
  label,
  value,
  onChange,
  placeholder,
  maxLength,
  disabled = false,
}: NumberFieldProps) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs text-destiny-text-subtle">{label}</label>
      <input
        type="text"
        inputMode="numeric"
        value={value}
        onChange={(e) => {
          // 숫자만 허용 (한글/영문 등 입력 방지)
          const onlyDigits = e.target.value.replace(/\D/g, '')
          if (onlyDigits.length <= maxLength) {
            onChange(onlyDigits)
          }
        }}
        placeholder={placeholder}
        maxLength={maxLength}
        disabled={disabled}
        className={`
          w-full rounded-lg bg-destiny-surface border border-destiny-border
          px-3 py-2.5 text-sm text-destiny-text placeholder:text-destiny-text-subtle
          focus:outline-none focus:border-destiny-primary transition-colors duration-200
          disabled:opacity-40 disabled:cursor-not-allowed
        `}
      />
    </div>
  )
}
