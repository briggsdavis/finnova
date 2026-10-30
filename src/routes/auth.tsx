import { useAuthActions } from "@convex-dev/auth/react"
import { useConvexAuth } from "convex/react"
import { Navigate } from "react-router"

export function Component() {
  const { isLoading, isAuthenticated } = useConvexAuth()
  const { signIn } = useAuthActions()

  if (isLoading) return null
  if (isAuthenticated) return <Navigate to="/admin" replace />

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        const data = new FormData(e.currentTarget)
        data.set("flow", (e.nativeEvent as SubmitEvent).submitter!.getAttribute("value")!)
        void signIn("password", data)
      }}
    >
      <input name="email" type="email" autoComplete="email" required />
      <input name="password" type="password" autoComplete="current-password" required />
      <button value="signIn">Sign in</button>
      <button value="signUp">Sign up</button>
    </form>
  )
}
