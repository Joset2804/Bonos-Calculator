import React, {useState, useReducer, createContext, useEffect} from "react"
import {onAuthStateChanged, signOut} from "firebase/auth"
import {auth, db} from "../firebaseConfig"
import AppReducer from "react"

import { getFirestore, collection, addDoc, getDocs, doc, getDoc, query, where, setDoc, deleteDoc } from  "firebase/firestore"


const AppContext = createContext()

function AppState (props) {
  const initialState = {}
  //VARIABLES
  const [nuevaTabla, setNuevaTabla] = useState(false)

  //DATOS INICIALES FORM

  const [datosIni, setDatosIni] = useState({
    valorNominal :0,
    valorComercial :0,
    numeroAnos :0,
    freCupon :"mensual",
    diasAno :365,
    tipoTasa :"",
    capitalizacion :"diaria",
    tasaInteres :0,
    tasaDescuento :0,
    fechaEmision :"",
    prima: 0,
    estructuracion: 0,
    colocacion: 0,
    flotacion: 0,
    cavali: 0,
    tipoBono:""
  })
  const [resultados, setResultados] = useState({})
  const [resultadosPA, setResultadosPA] = useState({
    precioActual: 0,
    utilidadPerdida: 0
  })
  const [resultadosRatio, setResultadosRatio] = useState({
    duracion: 0,
    convexidad: 0,
    total: 0,
    duracionModificada: 0
  })
  const [resultadosIR, setResultadosIR] = useState({
    tceaEmisor: 0,
    tceaEmisorEscudo: 0,
    treaBonista: 0
  })

  //LOgIN
  const [user, setUser] = useState(null)
  const [dataUser, setDataUser] = useState({})
  const [loading, setLoading] = useState(true)

  async function usernameExists (userUid) {
    const users = [];
    const docsRef = collection(db, "users")
    const q = await query(docsRef, where("uid", "==", userUid))
    const res = await getDocs(q);
    res.forEach((doc) => {
      users.push(doc.data());
    })
    return users[0]
  }

  useEffect(() => {
    const unsuscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setLoading(false);
      if (currentUser) {
        await usernameExists(currentUser.uid)
        .then((res) => {
          setDataUser({...res});
        })
        .catch((error)=>{
        })
      }
    })
    return () => unsuscribe();
  }, [])

  //LOgOUT
  const resetOutputs = () => {
    setNuevaTabla(false)
    setResultados({
      frecuenciaCupon: 0,
      diasCapitalizacion: 0,
      numPeriodosAno: 0,
      numTotalPeriodos: 0,
      tasaEfectivaAnual: 0,
      tasaEfectivaMensual: 0,
      cokMensual: 0,
      costesIniEmisor: 0,
      costesIniBonista: 0
    })
    setResultadosRatio({
      duracion: 0,
      convexidad: 0,
      total: 0,
      duracionModificada: 0
    })
    setResultadosPA({
      precioActual: 0,
      utilidadPerdida: 0
    })
    setResultadosIR({
      tceaEmisor: 0,
      tceaEmisorEscudo: 0,
      treaBonista: 0
    })
  }
  const logout = () => {
    setDataUser({})
    signOut(auth)
  }

  //MANEJO SAVE NUEVA TABLA
  const handleSave = async (obj) => {
    try {
      const collectionRef = collection (db, "users/" + dataUser.uid + "/coleccionPrueba");
      const docRef = doc(collectionRef, obj.titulo);
      await setDoc(docRef, obj)
    } catch (e) {
    }
  }

  const [state, dispatch] = useReducer(AppReducer, initialState)
  return(
    <AppContext.Provider value={{
      datosIni,
      setDatosIni,
      resultados,
      setResultados,
      nuevaTabla,
      setNuevaTabla,
      resultadosPA,
      setResultadosPA,
      resultadosRatio,
      setResultadosRatio,
      resultadosIR,
      setResultadosIR,
      resetOutputs,
      user,
      dataUser,
      logout,
      handleSave
    }}>
      {props.children}
    </AppContext.Provider>
  )
}

export {AppState, AppContext}
