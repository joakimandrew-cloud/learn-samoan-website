export default function LoadFailure({ message = 'This page did not load.' }) {
  return (
    <section className="load-failure" role="alert">
      <h1 className="display">Try that page again.</h1>
      <p>{message}</p>
      <button type="button" className="btn btn-primary" onClick={() => window.location.reload()}>Reload page</button>
    </section>
  )
}
