'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { useDeleteSkill } from './_hooks/use-delete-skill'

interface Props {
  skillId: string
}

export default function SkillOwnerActions({ skillId }: Props) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const deleteMutation = useDeleteSkill(skillId)
  const t = useTranslations('skills')
  const tCommon = useTranslations('common')

  return (
    <div className="flex flex-wrap items-center gap-2 mb-4">
      <Link
        href={`/skills/${skillId}/edit`}
        className="px-4 py-1.5 rounded-md text-sm font-medium border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
      >
        {tCommon('edit')}
      </Link>

      <button
        type="button"
        onClick={() => { setConfirmDelete(true); deleteMutation.reset() }}
        className="px-4 py-1.5 rounded-md text-sm font-medium border border-red-200 text-red-600 hover:bg-red-50 transition-colors"
      >
        {tCommon('delete')}
      </button>

      {deleteMutation.error && (
        <p className="text-sm text-red-600">{deleteMutation.error.message}</p>
      )}

      <ConfirmDialog
        open={confirmDelete}
        title={t('delete_skill_title')}
        description={t('delete_skill_desc')}
        confirmLabel={deleteMutation.isPending ? t('deleting') : tCommon('delete')}
        confirmVariant="danger"
        onConfirm={() => deleteMutation.mutate()}
        onCancel={() => { setConfirmDelete(false); deleteMutation.reset() }}
        busy={deleteMutation.isPending}
      />
    </div>
  )
}
