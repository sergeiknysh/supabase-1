import { useParams } from 'common'
import dayjs from 'dayjs'
import { AlertCircle, CheckCircle2, ChevronsLeftRight } from 'lucide-react'
import { useTheme } from 'next-themes'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import AuthorizeRequesterDetails from 'components/interfaces/Organization/OAuthApps/AuthorizeRequesterDetails'
import APIAuthorizationLayout from 'components/layouts/APIAuthorizationLayout'
import { FormPanel } from 'components/ui/Forms/FormPanel'
import ShimmeringLoader from 'components/ui/ShimmeringLoader'
import { useApiAuthorizationApproveMutation } from 'data/api-authorization/api-authorization-approve-mutation'
import { useApiAuthorizationDeclineMutation } from 'data/api-authorization/api-authorization-decline-mutation'
import { useApiAuthorizationQuery } from 'data/api-authorization/api-authorization-query'
import { useOrganizationProjectClaimMutation } from 'data/organizations/organization-project-claim-mutation'
import { useOrganizationProjectClaimQuery } from 'data/organizations/organization-project-claim-query'
import { useOrganizationsQuery } from 'data/organizations/organizations-query'
import { withAuth } from 'hooks/misc/withAuth'
import { BASE_PATH } from 'lib/constants'
import type { NextPageWithLayout } from 'types'
import {
  Alert,
  Alert_Shadcn_,
  AlertDescription_Shadcn_,
  AlertTitle_Shadcn_,
  Button,
  cn,
  Listbox,
} from 'ui'

// Need to handle if no organizations in account
// Need to handle if not logged in yet state

const APIAuthorizationPage: NextPageWithLayout = () => {
  const router = useRouter()
  const { auth_id, token: claimToken } = useParams()
  const [isApproving, setIsApproving] = useState(false)
  const [isDeclining, setIsDeclining] = useState(false)
  const [selectedOrgSlug, setSelectedOrgSlug] = useState<string>()
  const [step, setStep] = useState<'authorize' | 'connected'>('authorize')
  const [redirectUrl, setRedirectUrl] = useState<string | null>(null)
  const { resolvedTheme } = useTheme()

  const {
    data: organizations,
    isSuccess: isSuccessOrganizations,
    isLoading: isLoadingOrganizations,
  } = useOrganizationsQuery()
  const { data: requester, isLoading, isError, error } = useApiAuthorizationQuery({ id: auth_id })
  const isApproved = (requester?.approved_at ?? null) !== null
  const isExpired = dayjs().isAfter(dayjs(requester?.expires_at))

  const { mutate: approveRequest } = useApiAuthorizationApproveMutation({
    onSuccess: (res) => {
      if (claimToken) {
        setRedirectUrl(res.url)
        setStep('connected')
        return
      } else {
        window.location.href = res.url!
      }
    },
  })
  const { mutate: declineRequest } = useApiAuthorizationDeclineMutation({
    onSuccess: () => {
      toast.success('Declined API authorization request')
      router.push('/organizations')
    },
  })

  const { data: projectClaim, isSuccess: isSuccessProjectClaim } = useOrganizationProjectClaimQuery(
    {
      slug: selectedOrgSlug!,
      token: claimToken!,
    },
    {
      enabled: true,
      onSuccess: () => {
        console.log('success')
      },
    }
  )

  const { mutate: claimProject } = useOrganizationProjectClaimMutation({
    onSuccess: () => {
      window.location.href = redirectUrl!
    },
  })

  useEffect(() => {
    if (isSuccessOrganizations && organizations.length > 0) {
      setSelectedOrgSlug(organizations[0].slug)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSuccessOrganizations])

  const onApproveRequest = async () => {
    if (!auth_id) {
      return toast.error('Unable to approve request: auth_id is missing ')
    }
    if (!selectedOrgSlug) {
      return toast.error('Unable to approve request: No organization selected')
    }

    setIsApproving(true)
    approveRequest({ id: auth_id, slug: selectedOrgSlug }, { onError: () => setIsApproving(false) })
  }

  const onDeclineRequest = async () => {
    if (!auth_id) {
      return toast.error('Unable to decline request: auth_id is missing ')
    }
    if (!selectedOrgSlug) {
      return toast.error('Unable to decline request: No organization selected')
    }

    setIsDeclining(true)
    declineRequest({ id: auth_id, slug: selectedOrgSlug }, { onError: () => setIsDeclining(false) })
  }

  if (isLoading) {
    return (
      <FormPanel header={<p>Authorize API access</p>}>
        <div className="px-8 py-6 space-y-2">
          <ShimmeringLoader />
          <ShimmeringLoader className="w-3/4" />
          <ShimmeringLoader className="w-1/2" />
        </div>
      </FormPanel>
    )
  }

  if (auth_id === undefined) {
    return (
      <FormPanel header={<p>Authorization for API access</p>}>
        <div className="px-8 py-6">
          <Alert withIcon variant="warning" title="Missing authorization ID">
            Please provide a valid authorization ID in the URL
          </Alert>
        </div>
      </FormPanel>
    )
  }

  console.log('projectClaim', isSuccessProjectClaim)
  if (step === 'connected' && isSuccessProjectClaim && requester) {
    return (
      <FormPanel>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-sm">
          <div className="flex items-center mb-6">
            <div className="flex items-center">
              <div
                className={cn(
                  'w-8 h-8 bg-center bg-no-repeat bg-cover flex items-center justify-center rounded-md'
                )}
                style={{
                  backgroundImage: !!requester.icon ? `url('${requester.icon}')` : 'none',
                }}
              >
                {!requester.icon && (
                  <p className="text-foreground-light text-lg">{requester.name[0]}</p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-center w-28 relative">
              <div className="h-0.5 w-full border-2 border-dashed border-stronger" />
              <div className="rounded-full border flex items-center justify-center h-10 w-full shadow-sm">
                <ChevronsLeftRight className="text-muted-foreground" size={24} />
              </div>
              <div className="h-0.5  w-full border-2 border-dashed border-stronger z-10" />
            </div>

            <div className="w-8 h-8">
              <Image
                src={
                  resolvedTheme?.includes('dark')
                    ? `${BASE_PATH}/img/supabase-logo.svg`
                    : `${BASE_PATH}/img/supabase-logo.svg`
                }
                alt="Supabase Logo"
                className="w-full h-full"
                width={100}
                height={100}
              />
            </div>
          </div>
          <h2 className="text-center text-base text-foreground-light">
            Supabase will become the backend for{' '}
            <span className="text-foreground">{projectClaim?.project?.name}</span>.
          </h2>
          <p className="text-center text-foreground-lighter">
            Your backend will then be managed by Supabase.
          </p>
          <Button
            className="mt-8 mb-9"
            onClick={() => claimProject({ slug: selectedOrgSlug!, token: claimToken! })}
          >
            Continue connection
          </Button>
          <div className="w-full max-w-md space-y-4">
            <h3 className="">Why connect Lovable to Supabase?</h3>
            <ul className="space-y-3">
              <li className="flex space-x-2">
                <CheckCircle2 className="text-brand w-5 h-5" />
                <span>
                  <span className="text-foreground-light">Technical Support</span>
                  <span className="block text-foreground-lighter">
                    We're ready to answer your questions.
                  </span>
                </span>
              </li>
              <li className="flex space-x-2">
                <CheckCircle2 className="text-brand w-5 h-5" />
                <span>
                  <span className="text-foreground-light">Unrestricted usage.</span>
                  <span className="block text-foreground-lighter">
                    Scale your project as your users grow.
                  </span>
                </span>
              </li>
              <li className="flex space-x-2">
                <CheckCircle2 className="text-brand w-5 h-5" />
                <span>
                  <span className="text-foreground-light">Compute upgrades</span>
                  <span className="block text-foreground-lighter">
                    Handle larger database loads
                  </span>
                </span>
              </li>
            </ul>
          </div>
        </div>
      </FormPanel>
    )
  }

  if (isError) {
    return (
      <FormPanel header={<p>Authorize API access</p>}>
        <div className="px-8 py-6">
          <Alert
            withIcon
            variant="warning"
            title="Failed to fetch details for API authorization request"
          >
            <p>Please retry your authorization request from the requesting app</p>
            {error !== undefined && <p className="mt-2">Error: {error?.message}</p>}
          </Alert>
        </div>
      </FormPanel>
    )
  }

  if (isApproved) {
    const approvedOrganization = organizations?.find(
      (org) => org?.slug === requester.approved_organization_slug
    )

    return (
      <FormPanel header={<p>Authorize API access for {requester?.name}</p>}>
        <div className="w-full px-8 py-6 space-y-8">
          <Alert withIcon variant="success" title="This authorization request has been approved">
            <p>
              {requester.name} has read and write access to the organization "
              {approvedOrganization?.name ?? 'Unknown'}" and all of its projects
            </p>
            <p className="mt-2">
              Approved on: {dayjs(requester.approved_at).format('DD MMM YYYY HH:mm:ss (ZZ)')}
            </p>
          </Alert>
        </div>
      </FormPanel>
    )
  }

  const searchParams = new URLSearchParams(location.search)
  let pathname = location.pathname
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH
  if (basePath) {
    pathname = pathname.replace(basePath, '')
  }

  searchParams.set('returnTo', pathname)

  return (
    <FormPanel
      header={<p>Authorize API access for {requester?.name}</p>}
      footer={
        <div className="flex items-center justify-end py-4 px-8">
          <div className="flex items-center space-x-2">
            <Button
              type="default"
              loading={isDeclining}
              disabled={isApproving || isExpired}
              onClick={onDeclineRequest}
            >
              Decline
            </Button>
            {isLoadingOrganizations ? (
              <Button loading={isLoadingOrganizations}>Authorize {requester?.name}</Button>
            ) : isSuccessOrganizations && organizations.length === 0 ? (
              <Link href={`/new?${searchParams.toString()}`}>
                <Button loading={isLoadingOrganizations}>Create an organization</Button>
              </Link>
            ) : (
              <Button
                loading={isApproving}
                disabled={isDeclining || isExpired}
                onClick={onApproveRequest}
              >
                Authorize {requester?.name}
              </Button>
            )}
          </div>
        </div>
      }
    >
      <div className="w-full px-8 py-6 space-y-8">
        {/* API Authorization requester details */}
        <AuthorizeRequesterDetails
          icon={requester.icon}
          name={requester.name}
          domain={requester.domain}
          scopes={requester.scopes}
        />

        {/* Expiry warning */}
        {isExpired && (
          <Alert withIcon variant="warning" title="This authorization request is expired">
            Please retry your authorization request from the requesting app
          </Alert>
        )}

        {/* Organization selection */}
        {isLoadingOrganizations ? (
          <div className="py-4 space-y-2">
            <ShimmeringLoader />
            <ShimmeringLoader className="w-3/4" />
          </div>
        ) : organizations?.length === 0 ? (
          <Alert_Shadcn_ variant="warning">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle_Shadcn_>
              Organization is needed for installing an integration
            </AlertTitle_Shadcn_>
            <AlertDescription_Shadcn_ className="">
              Your account isn't associated with any organizations. To use this integration, it must
              be installed within an organization. You'll be redirected to create an organization
              first.
            </AlertDescription_Shadcn_>
          </Alert_Shadcn_>
        ) : (
          <Listbox
            label="Select an organization to grant API access to"
            value={selectedOrgSlug}
            disabled={isExpired}
            onChange={setSelectedOrgSlug}
          >
            {(organizations ?? []).map((organization) => (
              <Listbox.Option
                key={organization?.slug}
                label={organization?.name}
                value={organization?.slug}
              >
                {organization.name}
              </Listbox.Option>
            ))}
          </Listbox>
        )}
      </div>
    </FormPanel>
  )
}

APIAuthorizationPage.getLayout = (page) => <APIAuthorizationLayout>{page}</APIAuthorizationLayout>

export default withAuth(APIAuthorizationPage)
