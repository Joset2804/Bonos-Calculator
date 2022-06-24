import React, {useState, useContext} from "react"
import {AppContext} from "../context/appState.js"
import {createUserWithEmailAndPassword} from "firebase/auth"
import {auth, db} from "../firebaseConfig"
import {useNavigate} from "react-router-dom"

import { getFirestore, collection, addDoc, getDocs, doc, getDoc, query, where, setDoc, deleteDoc } from  "firebase/firestore"

export default function Register(){
  const navigate = useNavigate()
  const {user} = useContext(AppContext)

  const [registro, setRegistro] = useState({
    nombres:"",
    apellidos: "",
    nombreUsuario: "",
    email: "",
    uid: "",
    misTablas: {}
  })

  let [errorf, setErrorf ] = useState();

  function handleChange (e) {
    setRegistro({...registro, [e.target.name] : e.target.value})
  }

  async function usernameExists (username) {
    const users = [];
    const docsRef = collection(db, "users")
    const q = await query(docsRef, where("nombreUsuario", "==", username))
    const res = await getDocs(q);

    res.forEach((doc) => {
      users.push(doc.data());
    })

    return users.length > 0 ? users[0].uid : false;
  }

  async function createNewUser (newUser) {
    try {
      const collectionRef = collection (db, "users");
      const docRef = doc(collectionRef, newUser.uid);
      await setDoc(docRef, newUser)
    } catch (e) {
      console.log(e);
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorf("")
    try {
      await usernameExists(registro.nombreUsuario)
      .then((res)=>{
        if (res) {
          throw "error: El nombre de usuario ya esta en uso."
        }
      })
      if (registro.nombres === "" || registro.apellidos === "" || registro.nombreUsuario  === "") {
        throw "error: Datos incompletos"
      }
      await createUserWithEmailAndPassword(auth, registro.email, registro.password)
      .then((res)=>{
        registro.uid = res.user.uid
        createNewUser(registro)
      })
      navigate("/homepage");
    } catch (error) {
      console.log(error.code);
      if (error.code === "auth/weak-password") {
        setErrorf("Tu contraseña debe tener un minimo de 7 caracteres.")
      } else if (error.code === "auth/invalid-email") {
        setErrorf("Ingresa un email valido.")
      } else if (error.code === "auth/email-already-in-use") {
        setErrorf("El email ingresado ya esta en uso.")
      } else if (error === "error: datos incompletos") {
        setErrorf("Complete todos los espacios con sus datos")
      } else if (error === "error: El nombre de usuario ya esta en uso.") {
        setErrorf("El nombre de usuario ya esta en uso.")
      }
      else {
        setErrorf("Error: ingresa datos validos.")
      }
      console.log(error);
    }
  }

  return(
    <div className="register" style={{position:"absolute", width: "25%", height:"40%", top:"20%", left:"35%"  }}>
      {errorf && <div className="notificacionError">{errorf}</div>}
      <h1 className="titulo fontb" style={{fontFamily: "", fontSize:"2.8rem", marginBottom: "1rem"}}>Calculadora de Bonos</h1>
      <form  style={{flexDirection: "column"}} className="formLogin flex" onSubmit={handleSubmit} onSubmit={handleSubmit}>
        <label className="fontn s13">Nombres</label>
          <input style={{height:"1.5rem", marginBottom: "0.75rem"}} type="text" name="nombres" placeholder="ingresa tus nombres"
            onChange={handleChange}/>
        <label className="fontn s13">Apellidos</label>
          <input style={{height:"1.5rem", marginBottom: "0.75rem"}} type="text" name="apellidos" placeholder="ingresa tus apellidos"
            onChange={handleChange}/>
        <label className="fontn s13">Nombre de Usuario</label>
          <input style={{height:"1.5rem", marginBottom: "0.75rem"}} type="text" name="nombreUsuario" placeholder="ingresa un nombre de usuario"
            onChange={handleChange}/>
        <label className="fontn s13">Email</label>
        <input style={{height:"1.5rem", marginBottom: "0.75rem"}} className="fontn s13" type="email" name="email" placeholder="ingresa tu email"
          onChange={handleChange}/>
        <label className="fontn s13">Constraseña</label>
        <input style={{height:"1.5rem", marginBottom: "1.5rem"}} type="password" name="password" placeholder="ingresa una contraseña"
          onChange={handleChange}/>
        <button style={{width: "5rem", height:"2rem", borderRadius: "0.25rem", color: "#000", marginBottom: "0.75rem"}} type="submit">Registrar</button>
      </form>
    </div>
  )
}
