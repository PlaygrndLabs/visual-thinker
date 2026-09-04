import { useCallback, useMemo } from 'react'

import { useLocalStorageState } from '@/hooks/use-local-storage-state'
import { experiencesV1Schema } from '@/schemas/storage-schemas'

export const experiencesStorageKey = 'visual-thinker.experiences.v1'

export const knownExperiences = {
  canvasScrollZoom: 'canvas-scroll-zoom',
  canvasPan: 'canvas-pan',
  createNodeByDoubleClick: 'create-node-by-double-click',
}

export const experienceTips = {
  zoom: 'zoom',
  pan: 'pan',
  addNode: 'add-node',
}

const experienceLevelRank = {
  'not-experienced-yet': 0,
  'tried-once': 1,
  'may-know-it': 2,
  'knows-it': 3,
}

const tipPolicies = {
  [experienceTips.zoom]: {
    experience: knownExperiences.canvasScrollZoom,
    showThroughLevel: 'tried-once',
  },
  [experienceTips.pan]: {
    experience: knownExperiences.canvasPan,
    showThroughLevel: 'may-know-it',
  },
  [experienceTips.addNode]: {
    experience: knownExperiences.createNodeByDoubleClick,
    showThroughLevel: 'tried-once',
  },
}

const practiceBoutGapMs = 30 * 60 * 1000
const sameDayGapMs = 8 * 60 * 60 * 1000
const multiDayGapMs = 3 * 24 * 60 * 60 * 1000
const weekGapMs = 7 * 24 * 60 * 60 * 1000

const emptyExperience = {
  expLevel: 'not-experienced-yet',
  lastUsedAt: null,
  practiceStrength: 0,
  currentBoutUseCount: 0,
  retentionStrength: 0,
  spacedReturnCount: 0,
  longestSuccessfulGapMs: 0,
}

const defaultExperiences = Object.fromEntries(
  Object.values(knownExperiences).map((experience) => [
    experience,
    { ...emptyExperience },
  ]),
)

function getPracticeStrength(useCount) {
  if (useCount >= 8) return 4
  if (useCount >= 4) return 3
  if (useCount >= 2) return 2
  return useCount === 1 ? 1 : 0
}

function getRetentionEvidence(gapMs) {
  if (gapMs >= weekGapMs) return 4
  if (gapMs >= multiDayGapMs) return 3
  if (gapMs >= sameDayGapMs) return 2
  if (gapMs >= practiceBoutGapMs) return 1
  return 0
}

function getExperienceLevel(record) {
  if (
    record.retentionStrength >= 4 ||
    (record.practiceStrength === 4 && record.retentionStrength >= 2)
  ) {
    return 'knows-it'
  }

  if (record.practiceStrength >= 3 || record.retentionStrength >= 1) {
    return 'may-know-it'
  }

  return record.practiceStrength >= 1
    ? 'tried-once'
    : 'not-experienced-yet'
}

function keepHighestLevel(currentLevel, nextLevel) {
  return experienceLevelRank[nextLevel] > experienceLevelRank[currentLevel]
    ? nextLevel
    : currentLevel
}

function recordExperience(currentRecord, { now, prompted }) {
  const gapMs =
    currentRecord.lastUsedAt === null ? null : now - currentRecord.lastUsedAt
  const startsNewBout = gapMs === null || gapMs >= practiceBoutGapMs
  const currentBoutUseCount = startsNewBout
    ? 1
    : Math.min(currentRecord.currentBoutUseCount + 1, 8)
  const practiceStrength = Math.max(
    currentRecord.practiceStrength,
    getPracticeStrength(currentBoutUseCount),
  )
  const retentionEvidence =
    gapMs === null || prompted ? 0 : getRetentionEvidence(gapMs)
  const retentionStrength = Math.min(
    currentRecord.retentionStrength + retentionEvidence,
    6,
  )
  const nextRecord = {
    ...currentRecord,
    lastUsedAt: now,
    practiceStrength,
    currentBoutUseCount,
    retentionStrength,
    spacedReturnCount:
      retentionEvidence > 0
        ? Math.min(currentRecord.spacedReturnCount + 1, 3)
        : currentRecord.spacedReturnCount,
    longestSuccessfulGapMs:
      retentionEvidence > 0
        ? Math.max(currentRecord.longestSuccessfulGapMs, gapMs)
        : currentRecord.longestSuccessfulGapMs,
  }

  return {
    ...nextRecord,
    expLevel: keepHighestLevel(
      currentRecord.expLevel,
      getExperienceLevel(nextRecord),
    ),
  }
}

export function useExperiences() {
  const [experiences, setExperiences] = useLocalStorageState(
    experiencesStorageKey,
    defaultExperiences,
    experiencesV1Schema,
  )

  const flagExperience = useCallback(
    (experience, { prompted = false } = {}) => {
      if (!Object.hasOwn(defaultExperiences, experience)) {
        throw new Error(`Unknown experience: "${experience}"`)
      }

      const now = Date.now()
      setExperiences((currentExperiences) => ({
        ...currentExperiences,
        [experience]: recordExperience(currentExperiences[experience], {
          now,
          prompted,
        }),
      }))
    },
    [setExperiences],
  )

  const experienceLevels = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(experiences).map(([experience, record]) => [
          experience,
          record.expLevel,
        ]),
      ),
    [experiences],
  )

  const maySuggestTip = useCallback(
    (tips) => {
      for (const tip of tips) {
        const policy = tipPolicies[tip]
        if (!policy) throw new Error(`Unknown experience tip: "${tip}"`)

        if (
          experienceLevelRank[experienceLevels[policy.experience]] <=
          experienceLevelRank[policy.showThroughLevel]
        ) {
          return tip
        }
      }

      return 'none'
    },
    [experienceLevels],
  )

  return {
    experienceLevels,
    experiences,
    flagExperience,
    maySuggestTip,
  }
}
