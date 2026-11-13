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

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">
            Inventario de prendas
          </h2>
          <p className="text-gray-500">
            Administra las prendas de Ángeles Fashion.
          </p>
        </div>

        <button
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
          className="rounded-lg bg-rose-600 px-5 py-2 text-white hover:bg-rose-700"
        >
          {mostrarFormulario ? "Cancelar" : "+ Agregar prenda"}
        </button>
      </div>

      {error && (
        <div className="rounded-lg bg-red-100 p-3 text-red-700">{error}</div>
      )}

      {mensaje && (
        <div className="rounded-lg bg-green-100 p-3 text-green-700">
          {mensaje}
        </div>
      )}

      {mostrarFormulario && (
        <form
          onSubmit={guardarPrenda}
          className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
        >
          <h3 className="mb-5 text-lg font-semibold">
            {prendaEditando !== null
              ? "Editar prenda"
              : "Registrar nueva prenda"}
          </h3>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {[
              ["codigo", "Código"],
              ["nombre", "Nombre"],
              ["talla", "Talla"],
              ["color", "Color"],
            ].map(([campo, etiqueta]) => (
              <label key={campo} className="space-y-1">
                <span className="text-sm font-medium">{etiqueta}</span>
                <input
                  name={campo}
                  value={formulario[campo]}
                  onChange={cambiarCampo}
                  required
                  className="w-full rounded-lg border border-gray-300 p-2"
                />
              </label>
            ))}

            <label className="space-y-1">
              <span className="text-sm font-medium">Categoría</span>
              <select
                name="categoria_id"
                value={formulario.categoria_id}
                onChange={cambiarCampo}
                required
                className="w-full rounded-lg border border-gray-300 p-2"
              >
                <option value="">Seleccionar categoría</option>
                {categorias.map((categoria) => (
                  <option key={categoria.id} value={categoria.id}>
                    {categoria.nombre}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-1">
              <span className="text-sm font-medium">Estado</span>
              <select
                name="estado"
                value={formulario.estado}
                onChange={cambiarCampo}
                className="w-full rounded-lg border border-gray-300 p-2"
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
              <label key={campo} className="space-y-1">
                <span className="text-sm font-medium">{etiqueta}</span>
                <input
                  key={campo}
                  type="number"
                  min="0"
                  step="0.01"
                  name={campo}
                  value={formulario[campo]}
                  onChange={cambiarCampo}
                  required
                  className="w-full rounded-lg border border-gray-300 p-2"
                />
              </label>
            ))}

            <label className="space-y-1 md:col-span-2">
              <span className="text-sm font-medium">Descripción</span>
              <textarea
                name="descripcion"
                value={formulario.descripcion}
                onChange={cambiarCampo}
                rows="3"
                className="w-full rounded-lg border border-gray-300 p-2"
              />
            </label>
          </div>

          <button
            type="submit"
            disabled={guardando}
            className="mt-5 rounded-lg bg-rose-600 px-6 py-2 text-white hover:bg-rose-700 disabled:opacity-50"
          >
            {guardando
              ? "Guardando..."
              : prendaEditando !== null
                ? "Actualizar prenda"
                : "Guardar prenda"}
          </button>
        </form>
      )}

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
        {cargando ? (
          <p className="p-6 text-gray-500">Cargando inventario...</p>
        ) : prendas.length === 0 ? (
          <p className="p-6 text-gray-500">No hay prendas registradas.</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-100 text-gray-700">
              <tr>
                <th className="p-4">ID</th>
                <th className="p-4">Código</th>
                <th className="p-4">Nombre</th>
                <th className="p-4">Estado</th>
                <th className="p-4">Venta</th>
                <th className="p-4">Alquiler</th>
                <th className="p-4">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {prendas.map((prenda) => (
                <tr key={prenda.id} className="border-t">
                  <td className="p-4">{prenda.id}</td>
                  <td className="p-4">{prenda.codigo}</td>
                  <td className="p-4">{prenda.nombre}</td>
                  <td className="p-4 capitalize">{prenda.estado}</td>
                  <td className="p-4">{formatoPrecio(prenda.precio_venta)}</td>
                  <td className="p-4">
                    {formatoPrecio(prenda.precio_alquiler)}
                  </td>

                  <td className="p-4">
                    <div className="flex flex-col gap-2">
                      <div className="flex gap-2">
                        <button
                          onClick={() => editarPrenda(prenda)}
                          className="rounded-lg bg-blue-100 px-3 py-1 text-blue-700 hover:bg-blue-200"
                        >
                          Editar
                        </button>

                        <button
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
                          className={`rounded-lg px-3 py-1 ${
                            prenda.puede_eliminar === false
                              ? "cursor-not-allowed bg-gray-100 text-gray-400"
                              : "bg-red-100 text-red-700 hover:bg-red-200"
                          } disabled:opacity-60`}
                        >
                          {eliminandoId === prenda.id
                            ? "Eliminando..."
                            : "Eliminar"}
                        </button>
                      </div>

                      {prenda.puede_eliminar === false && (
                        <p className="flex items-center gap-1 text-xs text-amber-700">
                          {prenda.motivo_bloqueo}
                        </p>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
