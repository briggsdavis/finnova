import { Link, Outlet, ScrollRestoration } from "react-router"

export function Component() {
  return (
    <>
      <div className="flex min-h-dvh flex-col">
        <nav>
          <Link to="/">Home</Link>
        </nav>

        <main className="grow">
          <Outlet />
        </main>

        <footer>
          <p>Footer</p>
        </footer>
      </div>

      <ScrollRestoration />
    </>
  )
}

export function ErrorBoundary() {
  return <p>Something went wrong</p>
}
