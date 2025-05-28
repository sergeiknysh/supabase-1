import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { organizationKeys } from './keys'

import { components } from 'api-types'
import { get, handleError } from 'data/fetchers'
import type { ResponseError } from 'types'

type OrganizationProjectClaimVariables = {
  slug: string
  token: string
}

type OrganizationProjectClaimResponse = components['schemas']['OrganizationProjectClaimResponse']

export async function getOrganizationProjectClaim(
  { slug, token }: OrganizationProjectClaimVariables,
  signal?: AbortSignal
) {
  await new Promise((resolve) => setTimeout(resolve, 3000))
  console.log('ello')

  const result: OrganizationProjectClaimResponse = {
    created_at: '2025-05-27T12:00:00Z',
    created_by: 'test',
    expires_at: '2025-05-27T12:00:00Z',
    preview: {
      errors: [],
      info: [],
      members_exceeding_free_project_limit: [],
      source_subscription_plan: 'free',
      target_organization_eligible: true,
      target_organization_has_free_project_slots: true,
      target_subscription_plan: 'free',
      valid: true,
      warnings: [],
    },
    project: {
      name: 'ProjectName',
      ref: 'some-ref',
    },
  }
  return result
  if (!slug || !token) throw new Error('Slug and token are required')

  const { data, error } = await get(`/v1/organizations/{slug}/project-claim`, {
    params: { path: { slug, token } },
    signal,
  })

  if (error) handleError(error)
  return data
}

export type OrganizationProjectClaimData = Awaited<ReturnType<typeof getOrganizationProjectClaim>>
export type OrganizationProjectClaimError = ResponseError

export const useOrganizationProjectClaimQuery = <TData = OrganizationProjectClaimData>(
  { slug, token }: OrganizationProjectClaimVariables,
  {
    enabled = true,
    ...options
  }: UseQueryOptions<OrganizationProjectClaimData, OrganizationProjectClaimError, TData> = {}
) =>
  useQuery<OrganizationProjectClaimData, OrganizationProjectClaimError, TData>(
    organizationKeys.projectClaim(slug, token),
    ({ signal }) => getOrganizationProjectClaim({ slug, token }, signal),
    { ...options }
    // { enabled: enabled && typeof slug !== 'undefined' && typeof token !== 'undefined', ...options }
  )
