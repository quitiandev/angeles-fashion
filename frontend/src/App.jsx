import { useState } from "react";
import Login from "./pages/login";
import Dashboard from "./pages/Dashboard";

function App() {
  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);
  const [token, setToken] = useState(() => {
    return sessionStorage.getItem("token");
  });

  const manejarEnvio = async (e) => {
    e.preventDefault();
    setError("");
    setCargando(true);

    try {
      const respuesta = await fetch("http://127.0.0.1:8000/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          correo,
          contrasena,
        }),
      });

      const datos = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(
          typeof datos.detail === "string"
            ? datos.detail
            : "No fue posible iniciar sesión",
        );
      }

      if (!datos.access_token) {
        throw new Error("El servidor no devolvió un token de acceso");
      }

      sessionStorage.setItem("token", datos.access_token);
      setToken(datos.access_token);
      setContrasena("");
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  };

  const cerrarSesion = () => {
    sessionStorage.removeItem("token");
    setToken(null);
    setCorreo("");
    setContrasena("");
    setError("");
  };

  if (token) {
    return <Dashboard cerrarSesion={cerrarSesion} token={token} />;
  }

  return (
    <Login
      correo={correo}
      setCorreo={setCorreo}
      contrasena={contrasena}
      setContrasena={setContrasena}
      error={error}
      cargando={cargando}
      manejarEnvio={manejarEnvio}
    />
  );
}

export default App;
