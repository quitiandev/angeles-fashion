function Login({
  correo,
  setCorreo,
  contrasena,
  setContrasena,
  error,
  cargando,
  manejarEnvio,
}) {
  return (
    <main className="min-h-screen flex flex-col md:flex-row bg-white">
      <section className="relative w-full md:w-1/2 min-h-72 md:min-h-screen bg-rose-100 flex items-center justify-center overflow-hidden">
        <div
          className="absolute w-105 h-105 md:w-162.5 md:h-162.5 bg-[#bd729d]"
          style={{
            clipPath:
              "polygon(50% 0%, 62% 25%, 85% 12%, 75% 38%, 100% 50%, 75% 62%, 85% 88%, 62% 75%, 50% 100%, 38% 75%, 15% 88%, 25% 62%, 0% 50%, 25% 38%, 15% 12%, 38% 25%)",
          }}
        />

        <div className="relative z-10 flex flex-col items-center">
          <img
            src="/images/logo.png"
            alt="Logo de Ángeles Fashion"
            className="w-40 md:w-64 h-auto object-contain"
          />
        </div>
      </section>

      <section className="w-full md:w-1/2 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <h2 className="text-3xl font-bold text-gray-900">Bienvenida</h2>

          <p className="mt-2 mb-8 text-gray-500">
            Inicia sesión para administrar tu boutique
          </p>

          <form onSubmit={manejarEnvio} className="space-y-5">
            <div>
              <label
                htmlFor="correo"
                className="block mb-2 text-sm font-medium text-gray-700"
              >
                Correo electrónico
              </label>

              <input
                id="correo"
                type="email"
                required
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                placeholder="correo@ejemplo.com"
                className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:ring-2 focus:ring-[#bd729d]"
              />
            </div>

            <div>
              <label
                htmlFor="contrasena"
                className="block mb-2 text-sm font-medium text-gray-700"
              >
                Contraseña
              </label>

              <input
                id="contrasena"
                type="password"
                required
                value={contrasena}
                onChange={(e) => setContrasena(e.target.value)}
                placeholder="Ingresa tu contraseña"
                className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:ring-2 focus:ring-[#bd729d]"
              />
            </div>

            {error && (
              <p role="alert" className="text-sm text-red-600">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={cargando}
              className="w-full rounded-lg bg-[#85486e] py-3 font-semibold text-white hover:bg-[#70385a] disabled:opacity-50 cursor-pointer"
            >
              {cargando ? "Ingresando..." : "Iniciar sesión"}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}

export default Login;
