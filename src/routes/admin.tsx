import { useAuthActions } from "@convex-dev/auth/react"
import { useConvexAuth } from "convex/react"
import { Navigate } from "react-router"

export function Component() {
  const { isLoading, isAuthenticated } = useConvexAuth()
  const { signOut } = useAuthActions()

  if (isLoading) return null
  if (!isAuthenticated) return <Navigate to="/auth" replace />

  return (
    <>
      <h1>Admin</h1>
      <button onClick={() => void signOut()}>Sign out</button>
    </>
  )
}
