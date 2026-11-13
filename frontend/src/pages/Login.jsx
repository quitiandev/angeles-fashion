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
    <main className="flex min-h-screen items-center justify-center bg-[#f8f7f5] px-5 py-12">
      <div className="w-full max-w-100">
        <div className="mb-10 flex flex-col items-center text-center">
          <div className="relative mb-7 flex h-64 w-64 items-center justify-center sm:h-68 sm:w-68">
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-[#c08ca8]"
              style={{
                clipPath:
                  "polygon(50% 0%, 60% 22%, 75% 7%, 75% 30%, 93% 25%, 82% 43%, 100% 50%, 82% 57%, 93% 75%, 75% 70%, 75% 93%, 60% 78%, 50% 100%, 40% 78%, 25% 93%, 25% 70%, 7% 75%, 18% 57%, 0% 50%, 18% 43%, 7% 25%, 25% 30%, 25% 7%, 40% 22%)",
              }}
            />

            <img
              src="/images/logo.png"
              alt="Ángeles Fashion"
              className="relative z-10 h-auto w-36 object-contain sm:w-40 translate-x-1"
            />
          </div>

          <div className="mb-5 h-px w-10 bg-[#d9c6d1]" />

          <h1 className="text-[27px] font-medium tracking-tight text-[#302a2e]">
            Bienvenida
          </h1>

          <p className="mt-2 text-sm leading-relaxed text-[#8b8589]">
            Ingresa para gestionar la boutique
          </p>
        </div>

        <form
          onSubmit={manejarEnvio}
          className="space-y-5 rounded-2xl border border-[#ebe7e8] bg-white px-7 py-8 sm:px-9"
        >
          <div className="space-y-2">
            <label
              htmlFor="correo"
              className="block text-[13px] font-medium text-[#514b4f]"
            >
              Correo electrónico
            </label>

            <input
              id="correo"
              type="email"
              autoComplete="username"
              required
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              placeholder="correo@ejemplo.com"
              className="w-full rounded-lg border border-[#e9e5e7] bg-white px-4 py-3 text-sm text-[#302a2e] outline-none transition-colors placeholder:text-[#b7b1b5] focus:border-[#85486e]"
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="contrasena"
              className="block text-[13px] font-medium text-[#514b4f]"
            >
              Contraseña
            </label>

            <input
              id="contrasena"
              type="password"
              autoComplete="current-password"
              required
              value={contrasena}
              onChange={(e) => setContrasena(e.target.value)}
              placeholder="Ingresa tu contraseña"
              className="w-full rounded-lg border border-[#e9e5e7] bg-white px-4 py-3 text-sm text-[#302a2e] outline-none transition-colors placeholder:text-[#b7b1b5] focus:border-[#85486e]"
            />
          </div>

          {error && (
            <div
              role="alert"
              className="rounded-lg bg-[#fcf3f3] px-4 py-3 text-sm text-[#a34b54]"
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={cargando}
            className="mt-2 w-full cursor-pointer rounded-lg bg-[#85486e] px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-[#713a5c] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {cargando ? "Ingresando..." : "Iniciar sesión"}
          </button>
        </form>

        <p className="mt-8 text-center text-xs tracking-wide text-[#aaa3a7]">
          Ángeles Fashion Etiqueta & Glamour
        </p>
      </div>
    </main>
  );
}

export default Login;
