import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen bg-white flex flex-col items-center justify-center p-8">
      <div className="max-w-md w-full text-center">
        <div className="text-5xl mb-4">🏠</div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">EricImmo</h1>
        <p className="text-gray-500 mb-8">Plateforme agents immobiliers</p>
        <div className="flex flex-col gap-3">
          <Link
            href="/login"
            className="bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 px-6 rounded-xl transition-colors"
          >
            Connexion agent
          </Link>
          <Link
            href="/agents/eric-perniaux"
            className="border border-gray-200 hover:border-orange-300 text-gray-700 font-semibold py-3 px-6 rounded-xl transition-colors"
          >
            Voir ma page publique
          </Link>
        </div>
      </div>
    </main>
  )
}
