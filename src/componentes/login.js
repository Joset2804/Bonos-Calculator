import React, {useState} from "react"
import {Link} from "react-router-dom"
import {signInWithEmailAndPassword, sendPasswordResetEmail} from "firebase/auth"
import {auth} from "../firebaseConfig"
import {useNavigate} from "react-router-dom"

export default function Login(){
  const navigate = useNavigate()

  const [user, setUser] = useState({
    email: "",
    password:""
  })

  let [errorf, setErrorf ] = useState();

  function handleChange (e) {
    setUser({...user, [e.target.name] : e.target.value})
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorf("")
    try {
      await signInWithEmailAndPassword(auth, user.email, user.password)
      navigate("/homepage");
    } catch (error) {
      console.log(error.code);
      if (error.code === "auth/wrong-password") {
        setErrorf("Contraseña incorrecta. Intenta nuevamente.")
      } else if (error.code === "auth/user-not-found") {
        setErrorf("El email no esta asociado a ninguna cuenta. Intenta nuevamente.")
      } else {
        setErrorf("Error: ingresa datos validos.")
      }
      console.log(error.code);
    }
  }

  const handleResetPassword = async () => {
    if (!user.email) {
      return setErrorf("Ingresa el email de la cuenta que quieres recuperar.")
    }else {
      try {
        await sendPasswordResetEmail(auth, user.email)
        setErrorf("Se a enviado el email de recuperacion. Revisa tu bandeja de entrada.")
      } catch (error) {
        setErrorf("Verificamos que el email ingresado no esta vinculado a ninguna cuenta. No se pudo enviar el email de recuperacion. Comprueba si esta escrito correctamente.")
      }
    }

  }

  return(
    <div className="login" style={{position:"absolute", width: "25%", height:"40%", top:"20%", left:"35%"  }}>
      <h1 className="titulo fontb" style={{fontFamily: "", fontSize:"2.8rem", marginBottom: "1rem"}}>Calculadora de Bonos</h1>
      {errorf && <div className="notificacionError">{errorf}</div>}
      <form style={{flexDirection: "column"}} className="formLogin flex" onSubmit={handleSubmit}>
        <label className="fontn s13">Email</label>
        <input style={{height:"1.5rem", marginBottom: "0.75rem"}} type="email" name="email" placeholder="ingresa tu email"
          onChange={handleChange}/>
        <label className="fontn s13">Constraseña</label>
        <input style={{height:"1.5rem", marginBottom: "0.75rem"}} type="password" name="password" placeholder="ingresa una contraseña"
          onChange={handleChange}/>
        <button style={{width: "5rem", height:"2rem", borderRadius: "0.25rem", color: "#000", marginBottom: "0.75rem"}} type="submit">Ingresar</button>
        <a style={{marginBottom: "0.75rem"}} href="#" onClick={handleResetPassword}>Olvidaste tu contraseña?</a>
      </form>
      <Link to="/register" className="rel"><button style={{width: "7rem", height:"2rem", borderRadius: "0.25rem", color: "#000", marginBottom: "0.75rem"}}>Registrarme</button></Link>
    </div>
  )
}
