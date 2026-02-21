export default function SinAcceso() {
  return (
    <div className="flex min-h-screen bg-bg items-center justify-center">
      <div className="text-center max-w-sm p-8">
        <div className="text-5xl mb-4">🔒</div>
        <h1 className="font-display text-2xl font-bold text-text mb-3">Suscripción requerida</h1>
        <p className="text-text-dim mb-6">Tu cuenta no tiene acceso activo. Contactá a Areté Soluciones para activar tu suscripción.</p>
        <a href="https://wa.me/+549TUNUMERO" className="btn-primary inline-block px-6 py-3">
          Contactar Areté →
        </a>
      </div>
    </div>
  )
}
