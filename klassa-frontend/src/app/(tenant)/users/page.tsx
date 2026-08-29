import { getUsers, getInactiveUsers } from '@/features/users/api'
import UsersClient from '@/features/users/components/UsersClient'
import ErrorState from '@/shared/components/ErrorState'
import { logFetchError } from '@/shared/lib/log-error'

export default async function UsersPage() {
  const [users, inactiveUsers] = await Promise.all([
    getUsers().catch((err) => { logFetchError('users', err); return null }),
    getInactiveUsers().catch((err) => { logFetchError('inactive-users', err); return null }),
  ])

  if (!users || !inactiveUsers) {
    return (
      <div className="px-4 md:px-8 max-w-7xl mx-auto">
        <ErrorState message="Error al cargar los usuarios." />
      </div>
    )
  }

  return <UsersClient initialUsers={users} initialInactiveUsers={inactiveUsers} />
}
