'use client'

import React, { type FC, useState } from 'react'
import { useRubric } from '@/lib/hooks/useRubric'
import { type Rubric, type RubricInfo } from '@/shared/types'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { LinkBreak, Spinner } from '@phosphor-icons/react'
import styles from './journal.module.scss'

type JournalRubricProps = { subject: string; quarter: number }
type ScoreRow = {
  id: string
  title: string
  mark: string
  maxMark: string
  added?: boolean
}

const getColor = (score: number): string =>
  score < 65 ? '#ff3a27' : score < 85 ? '#fca40c' : '#1bd90d'

const getGrade = (score: number): number =>
  score < 40 ? 2 : score < 65 ? 3 : score < 85 ? 4 : 5

const toRows = (rubrics: Rubric[], kind: string): ScoreRow[] =>
  rubrics.map((rubric, index) => ({
    id: kind + '-' + rubric.id + '-' + index,
    title: rubric.title.ru,
    mark: /^\d+(?:[.,]\d+)?$/.test(rubric.mark) ? rubric.mark : '',
    maxMark: rubric.maxMark,
  }))

const points = (value: string): number => Number(value.replace(',', '.'))
const format = (value: number): string => Number(value.toFixed(2)).toString()

const validRow = (row: ScoreRow): boolean => {
  const maximum = points(row.maxMark)
  const mark = points(row.mark)
  return (
    row.maxMark.trim() !== '' &&
    Number.isFinite(maximum) &&
    maximum > 0 &&
    (row.mark.trim() === '' ||
      (Number.isFinite(mark) && mark >= 0 && mark <= maximum))
  )
}

const calculate = (rows: ScoreRow[]) => {
  const earned = rows.reduce(
    (sum, row) => sum + (row.mark.trim() === '' ? 0 : points(row.mark)),
    0,
  )
  const maximum = rows.reduce((sum, row) => sum + points(row.maxMark), 0)
  return {
    earned,
    maximum,
    score: maximum > 0 ? (earned / maximum) * 50 : 0,
  }
}

const RubricCalculator: FC<{ data: RubricInfo }> = ({ data }) => {
  const [chapterRows, setChapterRows] = useState(() =>
    toRows(data.sumChapterCriteria ?? [], 'chapter'),
  )
  const [quarterRows, setQuarterRows] = useState(() =>
    toRows(data.sumQuarterCriteria ?? [], 'quarter'),
  )
  const [editing, setEditing] = useState(false)
  const [nextId, setNextId] = useState(0)
  const allRows = [...chapterRows, ...quarterRows]
  const valid = allRows.every(validRow)
  const complete =
    chapterRows.length > 0 &&
    quarterRows.length > 0 &&
    allRows.every((row) => row.mark.trim() !== '')
  const chapter = valid ? calculate(chapterRows) : null
  const quarter = valid ? calculate(quarterRows) : null
  const total =
    chapter && quarter
      ? Number((chapter.score + quarter.score).toFixed(2))
      : null

  const reset = () => {
    setChapterRows(toRows(data.sumChapterCriteria ?? [], 'chapter'))
    setQuarterRows(toRows(data.sumQuarterCriteria ?? [], 'quarter'))
    setEditing(false)
  }

  const addRow = (kind: 'chapter' | 'quarter') => {
    const row: ScoreRow = {
      id: kind + '-new-' + nextId,
      title: kind === 'chapter' ? 'Новый СОР' : 'Новый СОЧ',
      mark: '',
      maxMark: '20',
      added: true,
    }
    setNextId((current) => current + 1)
    if (kind === 'chapter') setChapterRows((rows) => [...rows, row])
    else setQuarterRows((rows) => [...rows, row])
  }

  const renderRows = (
    rows: ScoreRow[],
    setRows: React.Dispatch<React.SetStateAction<ScoreRow[]>>,
  ) =>
    rows.map((row) => {
      const maximum = points(row.maxMark)
      const sliderEnabled = Number.isFinite(maximum) && maximum > 0
      const sliderValue = row.mark === '' ? 0 : points(row.mark)
      const sliderPercent = sliderEnabled
        ? Math.min(100, Math.max(0, (sliderValue / maximum) * 100))
        : 0
      const values = [row.mark, row.maxMark]
        .filter((value) => value !== '')
        .map(points)
      const sliderStep = values.every(Number.isInteger)
        ? '1'
        : values.every((value) => Number.isInteger(value * 2))
          ? '0.5'
          : '0.01'
      const sliderId = 'points-' + row.id

      return editing ? (
        <div className="mb-3 rounded-lg border bg-muted/30 p-3" key={row.id}>
          <div className="mb-2 flex items-start justify-between gap-2">
            <label htmlFor={sliderId} className="min-w-0 break-words text-sm">
              {row.title}
            </label>
            {row.added && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                aria-label={'Удалить ' + row.title}
                onClick={() =>
                  setRows((current) =>
                    current.filter((item) => item.id !== row.id),
                  )
                }
                className="-mr-2 -mt-2 px-2"
              >
                ×
              </Button>
            )}
          </div>
          <div className="mb-2 flex items-center justify-between gap-2 text-sm">
            <output htmlFor={sliderId} className="font-semibold tabular-nums">
              {row.mark === '' ? '— баллов' : format(sliderValue) + ' баллов'}
            </output>
            <div className="flex shrink-0 items-center gap-1 text-muted-foreground">
              <span>из</span>
              <Input
                aria-label={'Максимум: ' + row.title}
                type="number"
                inputMode="decimal"
                min="0.01"
                step="any"
                value={row.maxMark}
                onChange={(event) =>
                  setRows((current) =>
                    current.map((item) => {
                      if (item.id !== row.id) return item
                      const nextMaximum = points(event.target.value)
                      return {
                        ...item,
                        maxMark: event.target.value,
                        mark:
                          item.mark !== '' &&
                          Number.isFinite(nextMaximum) &&
                          nextMaximum > 0 &&
                          points(item.mark) > nextMaximum
                            ? format(nextMaximum)
                            : item.mark,
                      }
                    }),
                  )
                }
                className="h-8 w-16 px-1 text-center tabular-nums"
              />
            </div>
          </div>
          <input
            id={sliderId}
            type="range"
            min="0"
            max={sliderEnabled ? maximum : 1}
            step={sliderStep}
            value={sliderEnabled ? Math.min(sliderValue, maximum) : 0}
            disabled={!sliderEnabled}
            aria-valuetext={
              row.mark === ''
                ? 'Баллы не выбраны'
                : format(sliderValue) + ' из ' + row.maxMark
            }
            onPointerDown={() => {
              if (row.mark === '')
                setRows((current) =>
                  current.map((item) =>
                    item.id === row.id ? { ...item, mark: '0' } : item,
                  ),
                )
            }}
            onKeyDown={(event) => {
              if (
                row.mark === '' &&
                ['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)
              )
                setRows((current) =>
                  current.map((item) =>
                    item.id === row.id ? { ...item, mark: '0' } : item,
                  ),
                )
            }}
            onChange={(event) =>
              setRows((current) =>
                current.map((item) =>
                  item.id === row.id
                    ? { ...item, mark: event.target.value }
                    : item,
                ),
              )
            }
            className={styles.scoreSlider}
            style={{
              background:
                'linear-gradient(to right, hsl(var(--primary)) ' +
                sliderPercent +
                '%, hsl(var(--secondary)) ' +
                sliderPercent +
                '%)',
            }}
          />
          <div className="mt-1 flex justify-between text-xs text-muted-foreground">
            <span>0</span>
            <span>{sliderEnabled ? format(maximum) : 'Укажите максимум'}</span>
          </div>
        </div>
      ) : (
        <div
          className="mb-1 flex items-start justify-between gap-2"
          key={row.id}
        >
          <span className="min-w-0 break-words">{row.title}</span>
          <span className="shrink-0">
            {row.mark || '-'}/{row.maxMark}
          </span>
        </div>
      )
    })

  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="text-muted-foreground" aria-live="polite">
          {total === null ? 'Проверьте баллы' : format(total) + '%'}
        </p>
        <Button
          type="button"
          variant={editing ? 'outline' : 'secondary'}
          size="sm"
          onClick={editing ? reset : () => setEditing(true)}
        >
          {editing ? 'Сбросить' : 'Рассчитать оценку'}
        </Button>
      </div>
      <Progress
        value={total ?? 0}
        className="mb-4 h-1"
        color={getColor(total ?? 0)}
      />

      {editing && (
        <p className="mb-3 text-sm text-muted-foreground">
          Двигайте ползунок баллов; максимум можно изменить справа. Расчёт не
          изменяет данные в журнале.
        </p>
      )}

      <div className="mb-3">
        <div className="mb-2 flex justify-between text-muted-foreground">
          <p>СОР</p>
          <p>
            {chapter
              ? format(chapter.earned) +
                '/' +
                format(chapter.maximum) +
                ' — ' +
                format(chapter.score) +
                '%'
              : '—'}
          </p>
        </div>
        {renderRows(chapterRows, setChapterRows)}
        {editing && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="px-0 text-muted-foreground"
            onClick={() => addRow('chapter')}
          >
            + Добавить СОР
          </Button>
        )}
      </div>

      {(quarterRows.length > 0 || editing) && (
        <div>
          <div className="mb-2 flex justify-between text-muted-foreground">
            <p>СОЧ</p>
            <p>
              {quarter
                ? format(quarter.earned) +
                  '/' +
                  format(quarter.maximum) +
                  ' — ' +
                  format(quarter.score) +
                  '%'
                : '—'}
            </p>
          </div>
          {renderRows(quarterRows, setQuarterRows)}
          {editing && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="px-0 text-muted-foreground"
              onClick={() => addRow('quarter')}
            >
              + Добавить СОЧ
            </Button>
          )}
        </div>
      )}

      {editing && (
        <div
          className="mt-3 rounded-lg border bg-muted/50 p-3 text-sm"
          aria-live="polite"
        >
          {!valid ? (
            <p className="text-destructive">
              Максимум должен быть больше нуля, а баллы — от 0 до максимума.
            </p>
          ) : complete && total !== null ? (
            <p className="font-medium">
              Прогноз: {format(total)}% — оценка {getGrade(total)}
            </p>
          ) : (
            <p>Укажите баллы всех СОР и СОЧ, чтобы увидеть итоговую оценку.</p>
          )}
          <p className="mt-1 text-muted-foreground">
            СОР и СОЧ дают по 50%. Шкала: 40% — «3», 65% — «4», 85% — «5».
          </p>
        </div>
      )}
    </div>
  )
}

const JournalRubric: FC<JournalRubricProps> = ({ subject, quarter }) => {
  const { data, isLoading, isError } = useRubric(subject, quarter)

  if (isLoading)
    return (
      <div className="h-48 w-full">
        <div className="relative top-1/2 mx-auto h-fit w-fit -translate-y-1/2 transform">
          <Spinner
            size={28}
            className="animate-spin-slow text-muted-foreground"
          />
        </div>
      </div>
    )

  if (isError) {
    return (
      <div className="h-64 w-full">
        <div className="items center relative top-1/2 mx-auto h-fit w-fit -translate-y-1/2 transform text-center">
          <LinkBreak size={72} className="mx-auto text-red-600" />
          <h2 className="scroll-m-20 text-2xl font-semibold sm:text-3xl">
            Неизвестная ошибка
          </h2>
          <p className="mt-1 text-[14px] leading-5 text-muted-foreground sm:text-[17px]">
            Не удалось получить подробные данные о предмете. Вероятно, СУШ
            вашего филиала НИШ сейчас не работает.
          </p>
        </div>
      </div>
    )
  }

  if (!data) return null
  return <RubricCalculator key={subject + '-' + quarter} data={data} />
}

export default JournalRubric
