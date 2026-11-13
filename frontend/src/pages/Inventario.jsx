import { useEffect, useState } from "react";

const API = "http://127.0.0.1:8000";

const formularioInicial = {
  codigo: "",
  nombre: "",
  categoria_id: "",
  talla: "",
  color: "",
  precio_venta: "",
  precio_alquiler: "",
  estado: "disponible",
  descripcion: "",
};

export default function Inventario({ token }) {
  const [prendas, setPrendas] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [formulario, setFormulario] = useState(formularioInicial);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [prendaEditando, setPrendaEditando] = useState(null);
  const [eliminandoId, setEliminandoId] = useState(null);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  const headers = {
    Authorization: `Bearer ${token}`,
  };

  const cargarPrendas = async () => {
    const respuesta = await fetch(`${API}/prendas/`, { headers });

    if (!respuesta.ok) {
      throw new Error("No se pudo cargar el inventario");
    }

    const datos = await respuesta.json();
    setPrendas(datos);
  };

  useEffect(() => {
    let activo = true;

    const cargarDatos = async () => {
      try {
        setCargando(true);
        setError("");

        const [respuestaPrendas, respuestaCategorias] = await Promise.all([
          fetch(`${API}/prendas/`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API}/categorias/`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        if (!respuestaPrendas.ok || !respuestaCategorias.ok) {
          throw new Error("No se pudieron cargar los datos");
        }

        const datosPrendas = await respuestaPrendas.json();
        const datosCategorias = await respuestaCategorias.json();

        if (activo) {
          setPrendas(datosPrendas);
          setCategorias(datosCategorias);
        }
      } catch (err) {
        if (activo) setError(err.message);
      } finally {
        if (activo) setCargando(false);
      }
    };

    cargarDatos();

    return () => {
      activo = false;
    };
  }, [token]);

  const cambiarCampo = (e) => {
    const { name, value } = e.target;

    setFormulario((anterior) => ({
      ...anterior,
      [name]: value,
    }));
  };

  const guardarPrenda = async (e) => {
    e.preventDefault();
    setError("");
    setMensaje("");

    if (!formulario.categoria_id) {
      setError("Debes seleccionar una categoría");
      return;
    }

    setGuardando(true);

    try {
      const datosEnviar = {
        ...formulario,
        categoria_id: Number(formulario.categoria_id),
        precio_venta: Number(formulario.precio_venta),
        precio_alquiler: Number(formulario.precio_alquiler),
      };

      const editando = prendaEditando !== null;

      const url = editando
        ? `${API}/prendas/${prendaEditando}`
        : `${API}/prendas/`;

      const respuesta = await fetch(url, {
        method: editando ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(datosEnviar),
      });

      const datos = await respuesta.json().catch(() => ({}));

      if (!respuesta.ok) {
        throw new Error(
          typeof datos.detail === "string"
            ? datos.detail
            : "No se pudo guardar la prenda",
        );
      }

      await cargarPrendas();

      setFormulario({ ...formularioInicial });
      setPrendaEditando(null);
      setMostrarFormulario(false);

      setMensaje(
        editando
          ? "Prenda actualizada correctamente"
          : "Prenda registrada correctamente",
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setGuardando(false);
    }
  };

  const editarPrenda = (prenda) => {
    setPrendaEditando(prenda.id);

    setFormulario({
      codigo: prenda.codigo ?? "",
      nombre: prenda.nombre ?? "",
      categoria_id: String(prenda.categoria_id ?? ""),
      talla: prenda.talla ?? "",
      color: prenda.color ?? "",
      precio_venta: String(prenda.precio_venta ?? 0),
      precio_alquiler: String(prenda.precio_alquiler ?? 0),
      estado: prenda.estado ?? "disponible",
      descripcion: prenda.descripcion ?? "",
    });

    setError("");
    setMensaje("");
    setMostrarFormulario(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const cancelarFormulario = () => {
    setMostrarFormulario(false);
    setPrendaEditando(null);
    setFormulario({ ...formularioInicial });
    setError("");
  };

  const eliminarPrenda = async (prenda) => {
    const confirmar = window.confirm(
      `¿Estás seguro de eliminar "${prenda.nombre}"?`,
    );

    if (!confirmar) return;

    setEliminandoId(prenda.id);
    setError("");
    setMensaje("");

    try {
      const respuesta = await fetch(`${API}/prendas/${prenda.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!respuesta.ok) {
        const datos = await respuesta.json().catch(() => ({}));

        throw new Error(
          typeof datos.detail === "string"
            ? datos.detail
            : "No se pudo eliminar la prenda",
        );
      }

      await cargarPrendas();
      setMensaje("Prenda eliminada correctamente");
    } catch (err) {
      setError(err.message);
    } finally {
      setEliminandoId(null);
    }
  };

  const formatoPrecio = (valor) =>
    Number(valor ?? 0).toLocaleString("es-CO", {
      style: "currency",
      currency: "COP",
      maximumFractionDigits: 0,
    });

  const campoClase =
    "w-full rounded-lg border border-[#e7e1df] bg-white px-3.5 py-2.5 text-sm text-[#292524] outline-none transition placeholder:text-[#b4aaa5] focus:border-[#85486e] focus:ring-2 focus:ring-[#85486e]/10";
  const etiquetaClase = "mb-1.5 block text-sm font-medium text-[#57534e]";
  const estados = {
    disponible: "bg-[#e8f3ed] text-[#397259]",
    alquilada: "bg-[#e8edf7] text-[#526b9b]",
    alquilado: "bg-[#e8edf7] text-[#526b9b]",
    vendida: "bg-[#f1ece9] text-[#85766d]",
    vendido: "bg-[#f1ece9] text-[#85766d]",
    mantenimiento: "bg-[#fff2dd] text-[#a16a23]",
    no_disponible: "bg-[#f4e8ef] text-[#85486e]",
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#85486e]">
            Gestión de prendas
          </p>
          <h2 className="text-2xl font-semibold tracking-tight text-[#292524] md:text-3xl">
            Inventario
          </h2>
          <p className="mt-2 text-sm text-[#8a817d]">
            Organiza las prendas, consulta sus precios y administra su
            disponibilidad.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            if (mostrarFormulario) {
              cancelarFormulario();
            } else {
              setPrendaEditando(null);
              setFormulario({ ...formularioInicial });
              setMostrarFormulario(true);
              setError("");
              setMensaje("");
            }
          }}
          className={`cursor-pointer rounded-lg px-4 py-2.5 text-sm font-medium transition ${mostrarFormulario ? "border border-[#e7e1df] bg-white text-[#57534e] hover:bg-[#faf8f7]" : "bg-[#85486e] text-white hover:bg-[#713a5d]"}`}
        >
          {mostrarFormulario ? "Cancelar" : "+ Nueva prenda"}
        </button>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </div>
      )}
      {mensaje && (
        <div
          role="status"
          className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
        >
          {mensaje}
        </div>
      )}

      {mostrarFormulario && (
        <form
          onSubmit={guardarPrenda}
          className="overflow-hidden rounded-2xl border border-[#eae6e3] bg-white"
        >
          <div className="border-b border-[#eeeae7] px-5 py-5 md:px-7">
            <h3 className="text-lg font-semibold text-[#292524]">
              {prendaEditando !== null
                ? "Editar prenda"
                : "Registrar nueva prenda"}
            </h3>
            <p className="mt-1 text-sm text-[#8a817d]">
              Completa la información de la prenda para mantener el inventario
              actualizado.
            </p>
          </div>
          <div className="grid gap-x-5 gap-y-5 p-5 md:grid-cols-2 md:p-7">
            {[
              ["codigo", "Código"],
              ["nombre", "Nombre"],
              ["talla", "Talla"],
              ["color", "Color"],
            ].map(([campo, etiqueta]) => (
              <label key={campo} className="block">
                <span className={etiquetaClase}>{etiqueta}</span>
                <input
                  name={campo}
                  value={formulario[campo]}
                  onChange={cambiarCampo}
                  required
                  className={campoClase}
                />
              </label>
            ))}
            <label className="block">
              <span className={etiquetaClase}>Categoría</span>
              <select
                name="categoria_id"
                value={formulario.categoria_id}
                onChange={cambiarCampo}
                required
                className={campoClase}
              >
                <option value="">Seleccionar categoría</option>
                {categorias.map((categoria) => (
                  <option key={categoria.id} value={categoria.id}>
                    {categoria.nombre}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className={etiquetaClase}>Estado</span>
              <select
                name="estado"
                value={formulario.estado}
                onChange={cambiarCampo}
                className={campoClase}
              >
                <option value="disponible">Disponible</option>
                <option value="alquilado">Alquilado</option>
                <option value="vendido">Vendido</option>
              </select>
            </label>
            {[
              ["precio_venta", "Precio de venta"],
              ["precio_alquiler", "Precio de alquiler"],
            ].map(([campo, etiqueta]) => (
              <label key={campo} className="block">
                <span className={etiquetaClase}>{etiqueta}</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  name={campo}
                  value={formulario[campo]}
                  onChange={cambiarCampo}
                  required
                  className={campoClase}
                />
              </label>
            ))}
            <label className="block md:col-span-2">
              <span className={etiquetaClase}>Descripción</span>
              <textarea
                name="descripcion"
                value={formulario.descripcion}
                onChange={cambiarCampo}
                rows={3}
                className={`${campoClase} resize-y`}
              />
            </label>
          </div>
          <div className="flex flex-wrap justify-end gap-3 border-t border-[#eeeae7] bg-[#fcfbfa] px-5 py-4 md:px-7">
            <button
              type="button"
              onClick={cancelarFormulario}
              className="cursor-pointer rounded-lg border border-[#e7e1df] bg-white px-4 py-2.5 text-sm font-medium text-[#57534e] hover:bg-[#f8f7f5]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={guardando}
              className="cursor-pointer rounded-lg bg-[#85486e] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[#713a5d] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {guardando
                ? "Guardando..."
                : prendaEditando !== null
                  ? "Actualizar prenda"
                  : "Guardar prenda"}
            </button>
          </div>
        </form>
      )}

      <div className="overflow-hidden rounded-2xl border border-[#eae6e3] bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#eeeae7] px-5 py-5 md:px-7">
          <div>
            <h3 className="font-semibold text-[#292524]">
              Prendas registradas
            </h3>
            <p className="mt-1 text-xs text-[#8a817d]">
              Listado de prendas y sus precios actuales
            </p>
          </div>
          <span className="rounded-full bg-[#f6edf2] px-3 py-1.5 text-xs font-semibold text-[#85486e]">
            {prendas.length} {prendas.length === 1 ? "prenda" : "prendas"}
          </span>
        </div>
        {cargando ? (
          <p className="px-7 py-12 text-center text-sm text-[#8a817d]">
            Cargando inventario...
          </p>
        ) : prendas.length === 0 ? (
          <div className="px-7 py-14 text-center">
            <p className="font-medium text-[#292524]">
              Todavía no hay prendas registradas
            </p>
            <p className="mt-2 text-sm text-[#8a817d]">
              Usa «Nueva prenda» para registrar la primera.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-190 text-left text-sm">
              <thead className="bg-[#fcfbfa] text-xs font-medium text-[#8a817d]">
                <tr>
                  <th className="px-5 py-4 font-medium">Prenda</th>
                  <th className="px-5 py-4 font-medium">Código</th>
                  <th className="px-5 py-4 font-medium">Estado</th>
                  <th className="px-5 py-4 font-medium">Precio de venta</th>
                  <th className="px-5 py-4 font-medium">Precio de alquiler</th>
                  <th className="px-5 py-4 text-right font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0edeb]">
                {prendas.map((prenda) => (
                  <tr key={prenda.id} className="transition hover:bg-[#fcfbfa]">
                    <td className="px-5 py-4">
                      <p className="font-semibold text-[#292524]">
                        {prenda.nombre}
                      </p>
                      <p className="mt-1 text-xs text-[#a8a29e]">
                        ID #{prenda.id}
                      </p>
                    </td>
                    <td className="px-5 py-4 font-medium text-[#57534e]">
                      {prenda.codigo}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${estados[prenda.estado] || "bg-[#f1ece9] text-[#85766d]"}`}
                      >
                        {String(prenda.estado || "Sin estado").replaceAll(
                          "_",
                          " ",
                        )}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-[#57534e]">
                      {formatoPrecio(prenda.precio_venta)}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-[#57534e]">
                      {formatoPrecio(prenda.precio_alquiler)}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex flex-col items-end gap-2">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => editarPrenda(prenda)}
                            className="cursor-pointer rounded-lg border border-[#e7e1df] px-3 py-1.5 text-xs font-medium text-[#57534e] transition hover:border-[#c8a5b7] hover:text-[#85486e]"
                          >
                            Editar
                          </button>
                          <button
                            type="button"
                            onClick={() => eliminarPrenda(prenda)}
                            disabled={
                              prenda.puede_eliminar === false ||
                              eliminandoId === prenda.id
                            }
                            title={
                              prenda.puede_eliminar === false
                                ? prenda.motivo_bloqueo
                                : "Eliminar prenda"
                            }
                            className="cursor-pointer rounded-lg border border-[#f1d8d8] px-3 py-1.5 text-xs font-medium text-[#b45353] transition hover:bg-red-50 disabled:cursor-not-allowed disabled:border-[#eeeae7] disabled:bg-[#faf9f8] disabled:text-[#b4aaa5]"
                          >
                            {eliminandoId === prenda.id
                              ? "Eliminando..."
                              : "Eliminar"}
                          </button>
                        </div>
                        {prenda.puede_eliminar === false && (
                          <p className="max-w-50 text-right text-[11px] leading-relaxed text-[#a16a23]">
                            {prenda.motivo_bloqueo}
                          </p>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
