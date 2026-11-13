import { useEffect, useState } from "react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const formularioInicial = {
  nombre: "",
  descripcion: "",
};

function Configuracion({ token }) {
  const [categorias, setCategorias] = useState([]);
  const [formulario, setFormulario] = useState(formularioInicial);
  const [categoriaEditando, setCategoriaEditando] = useState(null);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  const obtenerError = async (respuesta) => {
    const datos = await respuesta.json().catch(() => null);

    if (typeof datos?.detail === "string") {
      return datos.detail;
    }

    return `Ocurrió un error (${respuesta.status}).`;
  };

  const cargarCategorias = async () => {
    setCargando(true);
    setError("");

    try {
      const respuesta = await fetch(`${API_URL}/categorias/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!respuesta.ok) {
        throw new Error(await obtenerError(respuesta));
      }

      const datos = await respuesta.json();
      setCategorias(datos);
    } catch (err) {
      setError(err.message || "No se pudieron cargar las categorías.");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();

    const cargarInicial = async () => {
      try {
        const respuesta = await fetch(`${API_URL}/categorias/`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        });

        if (!respuesta.ok) {
          throw new Error(await obtenerError(respuesta));
        }

        const datos = await respuesta.json();
        if (!controller.signal.aborted) {
          setCategorias(datos);
          setError("");
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          setError(err.message || "No se pudieron cargar las categorías.");
        }
      } finally {
        if (!controller.signal.aborted) setCargando(false);
      }
    };

    cargarInicial();
    return () => controller.abort();
  }, [token]);

  const abrirFormulario = (categoria = null) => {
    setCategoriaEditando(categoria);
    setFormulario(
      categoria
        ? {
            nombre: categoria.nombre,
            descripcion: categoria.descripcion || "",
          }
        : formularioInicial,
    );
    setError("");
    setMensaje("");
    setMostrarFormulario(true);
  };

  const cerrarFormulario = () => {
    setMostrarFormulario(false);
    setCategoriaEditando(null);
    setFormulario(formularioInicial);
  };

  const guardarCategoria = async (evento) => {
    evento.preventDefault();

    setGuardando(true);
    setError("");
    setMensaje("");

    const editando = categoriaEditando !== null;

    const url = editando
      ? `${API_URL}/categorias/${categoriaEditando.id}`
      : `${API_URL}/categorias/`;

    try {
      const respuesta = await fetch(url, {
        method: editando ? "PUT" : "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nombre: formulario.nombre.trim(),
          descripcion: formulario.descripcion.trim() || null,
        }),
      });

      if (!respuesta.ok) {
        throw new Error(await obtenerError(respuesta));
      }

      cerrarFormulario();
      await cargarCategorias();

      setMensaje(
        editando
          ? "Categoría actualizada correctamente."
          : "Categoría creada correctamente.",
      );
    } catch (err) {
      setError(err.message || "No se pudo guardar la categoría.");
    } finally {
      setGuardando(false);
    }
  };

  const eliminarCategoria = async (categoria) => {
    const confirmar = window.confirm(
      `¿Seguro que deseas eliminar la categoría "${categoria.nombre}"?`,
    );

    if (!confirmar) return;

    setError("");
    setMensaje("");

    try {
      const respuesta = await fetch(`${API_URL}/categorias/${categoria.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!respuesta.ok) {
        throw new Error(await obtenerError(respuesta));
      }

      await cargarCategorias();
      setMensaje("Categoría eliminada correctamente.");
    } catch (err) {
      setError(
        err.message ||
          "No se pudo eliminar la categoría. Puede estar asociada a prendas.",
      );
    }
  };

  const [usuarios, setUsuarios] = useState([]);
  const [cargandoUsuarios, setCargandoUsuarios] = useState(true);
  const [errorUsuarios, setErrorUsuarios] = useState("");
  const [mensajeUsuarios, setMensajeUsuarios] = useState("");
  const [guardandoUsuario, setGuardandoUsuario] = useState(false);
  const [modoUsuario, setModoUsuario] = useState(null);
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(null);
  const [datosUsuario, setDatosUsuario] = useState({
    nombre: "",
    correo: "",
    contrasena: "",
  });

  useEffect(() => {
    const controller = new AbortController();
    const cargar = async () => {
      try {
        const respuesta = await fetch(`${API_URL}/usuarios/`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        });
        if (!respuesta.ok) throw new Error(await obtenerError(respuesta));
        const datos = await respuesta.json();
        if (!controller.signal.aborted) setUsuarios(datos);
      } catch (err) {
        if (!controller.signal.aborted)
          setErrorUsuarios(
            err.message || "No se pudieron cargar los usuarios.",
          );
      } finally {
        if (!controller.signal.aborted) setCargandoUsuarios(false);
      }
    };
    cargar();
    return () => controller.abort();
  }, [token]);

  const recargarUsuarios = async () => {
    const respuesta = await fetch(`${API_URL}/usuarios/`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!respuesta.ok) throw new Error(await obtenerError(respuesta));
    setUsuarios(await respuesta.json());
  };

  const abrirUsuario = (modo, usuario = null) => {
    setModoUsuario(modo);
    setUsuarioSeleccionado(usuario);
    setDatosUsuario({
      nombre: usuario?.nombre || "",
      correo: usuario?.correo || "",
      contrasena: "",
    });
    setErrorUsuarios("");
    setMensajeUsuarios("");
  };

  const cerrarUsuario = () => {
    setModoUsuario(null);
    setUsuarioSeleccionado(null);
    setDatosUsuario({ nombre: "", correo: "", contrasena: "" });
  };

  const guardarUsuario = async (evento) => {
    evento.preventDefault();
    setGuardandoUsuario(true);
    setErrorUsuarios("");
    setMensajeUsuarios("");
    const esNuevo = modoUsuario === "crear";
    const esContrasena = modoUsuario === "contrasena";
    const url = esNuevo
      ? `${API_URL}/usuarios/`
      : esContrasena
        ? `${API_URL}/usuarios/${usuarioSeleccionado.id}/contrasena`
        : `${API_URL}/usuarios/${usuarioSeleccionado.id}`;
    const body = esContrasena
      ? { contrasena: datosUsuario.contrasena }
      : {
          nombre: datosUsuario.nombre.trim(),
          correo: datosUsuario.correo.trim().toLowerCase(),
          ...(esNuevo ? { contrasena: datosUsuario.contrasena } : {}),
        };
    try {
      const respuesta = await fetch(url, {
        method: esNuevo ? "POST" : esContrasena ? "PATCH" : "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
      if (!respuesta.ok) throw new Error(await obtenerError(respuesta));
      await recargarUsuarios();
      cerrarUsuario();
      setMensajeUsuarios(
        esNuevo
          ? "Usuario creado correctamente."
          : esContrasena
            ? "Contraseña actualizada correctamente."
            : "Usuario actualizado correctamente.",
      );
    } catch (err) {
      setErrorUsuarios(err.message || "No se pudo guardar el usuario.");
    } finally {
      setGuardandoUsuario(false);
    }
  };

  const cambiarEstadoUsuario = async (usuario) => {
    const accion = usuario.activo ? "desactivar" : "activar";
    if (!window.confirm(`¿Deseas ${accion} la cuenta de ${usuario.nombre}?`))
      return;
    setErrorUsuarios("");
    setMensajeUsuarios("");
    try {
      const respuesta = await fetch(
        `${API_URL}/usuarios/${usuario.id}/estado`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ activo: !usuario.activo }),
        },
      );
      if (!respuesta.ok) throw new Error(await obtenerError(respuesta));
      await recargarUsuarios();
      setMensajeUsuarios(
        `Usuario ${usuario.activo ? "desactivado" : "activado"} correctamente.`,
      );
    } catch (err) {
      setErrorUsuarios(
        err.message || "No se pudo cambiar el estado del usuario.",
      );
    }
  };

  return (
    <div className="space-y-7">
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#85486e]">
          Administración
        </p>
        <h2 className="text-3xl font-semibold tracking-tight text-[#292524]">
          Configuración
        </h2>
        <p className="mt-2 text-sm text-[#8a817d]">
          Administra las categorías y los accesos de tu boutique.
        </p>
      </div>

      <section className="overflow-hidden rounded-xl border border-[#eae6e3] bg-white">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#eeeae7] px-6 py-5">
          <div>
            <h3 className="text-lg font-semibold text-[#292524]">Categorías</h3>
            <p className="mt-1 text-sm text-[#8a817d]">
              Organiza las prendas de tu inventario.
            </p>
          </div>

          <button
            type="button"
            onClick={() => abrirFormulario()}
            className="cursor-pointer rounded-lg bg-[#85486e] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#713a5c]"
          >
            + Nueva categoría
          </button>
        </div>

        <div className="p-6">
          {mensaje && (
            <p
              role="status"
              className="mb-5 rounded-lg bg-[#f2f7f2] px-4 py-3 text-sm text-[#426747]"
            >
              {mensaje}
            </p>
          )}

          {error && (
            <p
              role="alert"
              className="mb-5 rounded-lg bg-[#fcf3f3] px-4 py-3 text-sm text-[#a34b54]"
            >
              {error}
            </p>
          )}

          {mostrarFormulario && (
            <form
              onSubmit={guardarCategoria}
              className="mb-6 space-y-4 rounded-xl border border-[#eee5ea] bg-[#fcfafb] p-5"
            >
              <h4 className="font-semibold text-[#292524]">
                {categoriaEditando ? "Editar categoría" : "Nueva categoría"}
              </h4>

              <div>
                <label
                  htmlFor="nombreCategoria"
                  className="mb-2 block text-sm font-medium text-[#57534e]"
                >
                  Nombre
                </label>
                <input
                  id="nombreCategoria"
                  required
                  minLength={2}
                  maxLength={50}
                  value={formulario.nombre}
                  onChange={(e) =>
                    setFormulario({
                      ...formulario,
                      nombre: e.target.value,
                    })
                  }
                  placeholder="Ej. Vestidos de gala"
                  className="w-full rounded-lg border border-[#e5dfdf] bg-white px-4 py-3 text-sm outline-none focus:border-[#85486e]"
                />
              </div>

              <div>
                <label
                  htmlFor="descripcionCategoria"
                  className="mb-2 block text-sm font-medium text-[#57534e]"
                >
                  Descripción (opcional)
                </label>
                <textarea
                  id="descripcionCategoria"
                  rows={3}
                  maxLength={255}
                  value={formulario.descripcion}
                  onChange={(e) =>
                    setFormulario({
                      ...formulario,
                      descripcion: e.target.value,
                    })
                  }
                  placeholder="Descripción de la categoría"
                  className="w-full resize-none rounded-lg border border-[#e5dfdf] bg-white px-4 py-3 text-sm outline-none focus:border-[#85486e]"
                />
              </div>

              <div className="flex flex-wrap justify-end gap-3">
                <button
                  type="button"
                  onClick={cerrarFormulario}
                  disabled={guardando}
                  className="cursor-pointer rounded-lg border border-[#eae6e3] px-4 py-2.5 text-sm text-[#57534e] disabled:opacity-50"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={guardando}
                  className="cursor-pointer rounded-lg bg-[#85486e] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#713a5c] disabled:opacity-50"
                >
                  {guardando ? "Guardando..." : "Guardar categoría"}
                </button>
              </div>
            </form>
          )}

          {cargando ? (
            <p className="py-8 text-center text-sm text-[#8a817d]">
              Cargando categorías...
            </p>
          ) : categorias.length === 0 ? (
            <div className="py-12 text-center">
              <p className="font-medium text-[#57534e]">
                Todavía no hay categorías
              </p>
              <p className="mt-2 text-sm text-[#a8a29e]">
                Crea una para comenzar a organizar tus prendas.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[#f0ecea]">
              {categorias.map((categoria) => (
                <div
                  key={categoria.id}
                  className="flex flex-wrap items-center justify-between gap-4 py-4"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-[#292524]">
                      {categoria.nombre}
                    </p>
                    <p className="mt-1 text-sm text-[#8a817d]">
                      {categoria.descripcion || "Sin descripción"}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => abrirFormulario(categoria)}
                      className="cursor-pointer rounded-lg border border-[#eae6e3] px-3 py-2 text-xs font-medium text-[#85486e] hover:bg-[#f8f7f5]"
                    >
                      Editar
                    </button>

                    <button
                      type="button"
                      onClick={() => eliminarCategoria(categoria)}
                      className="cursor-pointer rounded-lg border border-[#f0dede] px-3 py-2 text-xs font-medium text-[#b05b62] hover:bg-[#fcf3f3]"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border border-[#eae6e3] bg-white">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#eeeae7] px-6 py-5">
          <div>
            <h3 className="text-lg font-semibold text-[#292524]">Usuarios</h3>
            <p className="mt-1 text-sm text-[#8a817d]">
              Administra las cuentas autorizadas para ingresar al sistema.
            </p>
          </div>
          <button
            type="button"
            onClick={() => abrirUsuario("crear")}
            className="cursor-pointer rounded-lg bg-[#85486e] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#713a5c]"
          >
            + Nuevo usuario
          </button>
        </div>

        <div className="p-6">
          {mensajeUsuarios && (
            <p
              role="status"
              className="mb-5 rounded-lg bg-[#f2f7f2] px-4 py-3 text-sm text-[#426747]"
            >
              {mensajeUsuarios}
            </p>
          )}
          {errorUsuarios && (
            <p
              role="alert"
              className="mb-5 rounded-lg bg-[#fcf3f3] px-4 py-3 text-sm text-[#a34b54]"
            >
              {errorUsuarios}
            </p>
          )}

          {modoUsuario && (
            <form
              onSubmit={guardarUsuario}
              className="mb-6 space-y-4 rounded-xl border border-[#eee5ea] bg-[#fcfafb] p-5"
            >
              <h4 className="font-semibold text-[#292524]">
                {modoUsuario === "crear"
                  ? "Nuevo usuario"
                  : modoUsuario === "editar"
                    ? "Editar usuario"
                    : `Cambiar contraseña de ${usuarioSeleccionado?.nombre}`}
              </h4>
              {modoUsuario !== "contrasena" && (
                <>
                  <div>
                    <label
                      htmlFor="usuarioNombre"
                      className="mb-2 block text-sm font-medium text-[#57534e]"
                    >
                      Nombre
                    </label>
                    <input
                      id="usuarioNombre"
                      required
                      minLength={2}
                      maxLength={50}
                      value={datosUsuario.nombre}
                      onChange={(e) =>
                        setDatosUsuario((prev) => ({
                          ...prev,
                          nombre: e.target.value,
                        }))
                      }
                      placeholder="Nombre completo"
                      className="w-full rounded-lg border border-[#e5dfdf] bg-white px-4 py-3 text-sm outline-none focus:border-[#85486e]"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="usuarioCorreo"
                      className="mb-2 block text-sm font-medium text-[#57534e]"
                    >
                      Correo electrónico
                    </label>
                    <input
                      id="usuarioCorreo"
                      type="email"
                      required
                      maxLength={100}
                      value={datosUsuario.correo}
                      onChange={(e) =>
                        setDatosUsuario((prev) => ({
                          ...prev,
                          correo: e.target.value,
                        }))
                      }
                      placeholder="correo@ejemplo.com"
                      className="w-full rounded-lg border border-[#e5dfdf] bg-white px-4 py-3 text-sm outline-none focus:border-[#85486e]"
                    />
                  </div>
                </>
              )}
              {modoUsuario !== "editar" && (
                <div>
                  <label
                    htmlFor="usuarioContrasena"
                    className="mb-2 block text-sm font-medium text-[#57534e]"
                  >
                    {modoUsuario === "crear"
                      ? "Contraseña"
                      : "Nueva contraseña"}
                  </label>
                  <input
                    id="usuarioContrasena"
                    type="password"
                    required
                    minLength={8}
                    maxLength={128}
                    autoComplete="new-password"
                    value={datosUsuario.contrasena}
                    onChange={(e) =>
                      setDatosUsuario((prev) => ({
                        ...prev,
                        contrasena: e.target.value,
                      }))
                    }
                    placeholder="Mínimo 8 caracteres"
                    className="w-full rounded-lg border border-[#e5dfdf] bg-white px-4 py-3 text-sm outline-none focus:border-[#85486e]"
                  />
                  <p className="mt-1 text-xs text-[#a8a29e]">
                    La contraseña no se mostrará en la lista de usuarios.
                  </p>
                </div>
              )}
              <div className="flex flex-wrap justify-end gap-3">
                <button
                  type="button"
                  onClick={cerrarUsuario}
                  disabled={guardandoUsuario}
                  className="cursor-pointer rounded-lg border border-[#eae6e3] px-4 py-2.5 text-sm text-[#57534e] disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardandoUsuario}
                  className="cursor-pointer rounded-lg bg-[#85486e] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#713a5c] disabled:opacity-50"
                >
                  {guardandoUsuario
                    ? "Guardando..."
                    : modoUsuario === "contrasena"
                      ? "Cambiar contraseña"
                      : "Guardar usuario"}
                </button>
              </div>
            </form>
          )}

          {cargandoUsuarios ? (
            <p className="py-8 text-center text-sm text-[#8a817d]">
              Cargando usuarios...
            </p>
          ) : usuarios.length === 0 ? (
            <div className="py-12 text-center">
              <p className="font-medium text-[#57534e]">
                Todavía no hay usuarios
              </p>
              <p className="mt-2 text-sm text-[#a8a29e]">
                Crea una cuenta para comenzar.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[#f0ecea]">
              {usuarios.map((usuario) => (
                <div
                  key={usuario.id}
                  className="flex flex-wrap items-center justify-between gap-4 py-4"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-[#292524]">
                        {usuario.nombre}
                      </p>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${usuario.activo ? "bg-[#edf5ef] text-[#42764c]" : "bg-[#f5f1ef] text-[#8a817d]"}`}
                      >
                        {usuario.activo ? "Activo" : "Inactivo"}
                      </span>
                    </div>
                    <p className="mt-1 break-all text-sm text-[#8a817d]">
                      {usuario.correo}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => abrirUsuario("editar", usuario)}
                      className="cursor-pointer rounded-lg border border-[#eae6e3] px-3 py-2 text-xs font-medium text-[#85486e] hover:bg-[#f8f7f5]"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => abrirUsuario("contrasena", usuario)}
                      className="cursor-pointer rounded-lg border border-[#eae6e3] px-3 py-2 text-xs font-medium text-[#85486e] hover:bg-[#f8f7f5]"
                    >
                      Contraseña
                    </button>
                    <button
                      type="button"
                      onClick={() => cambiarEstadoUsuario(usuario)}
                      className={`cursor-pointer rounded-lg border px-3 py-2 text-xs font-medium ${usuario.activo ? "border-[#f0dede] text-[#b05b62] hover:bg-[#fcf3f3]" : "border-[#d8e9da] text-[#42764c] hover:bg-[#f2f7f2]"}`}
                    >
                      {usuario.activo ? "Desactivar" : "Activar"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

export default Configuracion;
