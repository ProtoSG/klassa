import { getUsers, getInactiveUsers } from '@/features/users/api'
import UsersClient from '@/features/users/components/UsersClient'

export default async function UsersPage() {
  const [users, inactiveUsers] = await Promise.all([
    getUsers().catch(() => []),
    getInactiveUsers().catch(() => []),
  ])

  return <UsersClient initialUsers={users} initialInactiveUsers={inactiveUsers} />
}
