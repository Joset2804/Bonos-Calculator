import React, {useState, useContext, useEffect} from "react";
import {AppContext} from "../context/appState.js"
import { getFirestore, collection, addDoc, getDocs, doc, getDoc, query, where, setDoc, deleteDoc } from  "firebase/firestore"
import {db} from "../firebaseConfig.js"


export default function MisTablas (){
  const {datosIni, setDatosIni, resultados, setResultados, user, dataUser, handleSave} = useContext(AppContext)
  const [tablasGuardadas, setTablasGuardadas] = useState([])
  const [existeTablaSeleccionada, setExisteTablaSeleccionada] = useState(false)
  const [existenTablas, setExistenTablas] = useState(false)
  const [tablaSeleccionada, setTablaSeleccionada] = useState()

  async function loadTablasGuardadas () {
    const tablas = [];
    const docsRef = collection(db, "users/" + dataUser.uid + "/coleccionPrueba")
    const res = await getDocs(docsRef);
    res.forEach((doc) => {
      tablas.push(doc.data())
    })
    return tablas
  }

  function renderTablasGuardadas (e) {
    console.log(e.target.title)
    setExisteTablaSeleccionada(true)
    let seleccionado = tablasGuardadas.filter(tabla => tabla.titulo === e.target.title);
    console.log(seleccionado)
    setTablaSeleccionada(seleccionado[0].tabla)
    console.log(existeTablaSeleccionada)
  }

  async function borrarTabla (e) {
    await deleteDoc(doc(db,"users/" + dataUser.uid + "/coleccionPrueba", e.target.name))
    .then(() => {
      let nuevaTabla = tablasGuardadas.filter(tabla => tabla.titulo !== e.target.name)
      setTablasGuardadas(nuevaTabla)
    })
    .catch(error => console.log(error))
  }
  function handleCerrarTabla () {
    setExisteTablaSeleccionada(false)
    setTablaSeleccionada()
  }

  useEffect( () => {
    loadTablasGuardadas()
    .then((res)=>{
      if(res.length > 0){
        setTablasGuardadas(res)
        setExistenTablas(true)
      }
    })
    .catch((e)=>{
      console.log(e)
    })
  }, [])

  let filaArray = []
  if (tablaSeleccionada){
    for (var i = 0; i < tablaSeleccionada.length; i++) {
      filaArray.push(
        <ul className="fila flex">
          <li className="itemFila">{tablaSeleccionada[i].index}</li>
          <li className="itemFila">{tablaSeleccionada[i].inflacionAnual.toFixed(2)}</li>
          <li className="itemFila">{tablaSeleccionada[i].inflacionSemestral.toFixed(2)}</li>
          <li className="itemFila">{tablaSeleccionada[i].plazoGracia}</li>
          <li className="itemFila">{tablaSeleccionada[i].bono}</li>
          <li className="itemFila">{tablaSeleccionada[i].bonoIndexado}</li>
          <li className="itemFila">{tablaSeleccionada[i].amortizacion.toFixed(2)}</li>
          <li className="itemFila">{tablaSeleccionada[i].prima.toFixed(2)}</li>
          <li className="itemFila">{tablaSeleccionada[i].cuponInteres.toFixed(2)}</li>
          <li className="itemFila">{tablaSeleccionada[i].cuota.toFixed(2)}</li>
          <li className="itemFila">{tablaSeleccionada[i].escudo.toFixed(2)}</li>
          <li className="itemFila">{tablaSeleccionada[i].flujoEmisor.toFixed(2)}</li>
          <li className="itemFila">{tablaSeleccionada[i].flujoEmisorEscudo.toFixed(2)}</li>
          <li className="itemFila">{tablaSeleccionada[i].flujoBonista.toFixed(2)}</li>
          <li className="itemFila">{tablaSeleccionada[i].flujoAct.toFixed(2)}</li>
          <li className="itemFila">{tablaSeleccionada[i].FAPlazo.toFixed(2)}</li>
          <li className="itemFila">{tablaSeleccionada[i].factorConversidad.toFixed(2)}</li>
        </ul>
      )
    }
  }


  let misTablas = []
  for (var i = 0; i < tablasGuardadas.length; i++) {
    misTablas.push(
      <li className="itemTablaGuardada" Key={i}>
        <label className="tituloTablaGuardada" title={tablasGuardadas[i].titulo} onClick={renderTablasGuardadas}>{tablasGuardadas[i].titulo}</label>
        <button className="botonBorrarTablaGuardada" name={tablasGuardadas[i].titulo} onClick={borrarTabla}>Borrar</button>
      </li>)
  }
  return(
      <div className="misTablas">
        <div className="seccionTablasGuardadas">
          <h2 className="titulo s24 fontb">Mis Tablas Guardadas</h2>
          <ul className="listaTablasGuardadas">
            {misTablas}
          </ul>
        </div>
        <div className="seccionTablaSeleccionada">
          {
            existeTablaSeleccionada === true ?
              <div className = "flex">
                <h3 className="tituloTabla">Tabla Resultados</h3>
                <button style={{
                  width: "5.5rem",
                  height: "2rem",
                  margin: "0 0 0 1rem"
                }} onClick={handleCerrarTabla}>Cerrar</button>
              </div>
              : <div>SELECCIONA UNA TABLA</div>
          }
          <div className="tablaSeleccionada">
          {
            tablaSeleccionada &&
                <div className="filaTitulos flex">
                  <h4 className="titulo">Index</h4>
                  <h4 className="titulo">I.Anual</h4>
                  <h4 className="titulo">I.Semestral</h4>
                  <h4 className="titulo">P.Gracia</h4>
                  <h4 className="titulo">Bono</h4>
                  <h4 className="titulo">B.Index.</h4>
                  <h4 className="titulo">Amort</h4>
                  <h4 className="titulo">Prima</h4>
                  <h4 className="titulo">Cupon Int.</h4>
                  <h4 className="titulo">Cuota</h4>
                  <h4 className="titulo">Escudo</h4>
                  <h4 className="titulo">F.Emisor</h4>
                  <h4 className="titulo">F.E.Escudo</h4>
                  <h4 className="titulo">F.Bonista</h4>
                  <h4 className="titulo">F.Actual</h4>
                  <h4 className="titulo">F.A.Plazo</h4>
                  <h4 className="titulo">F.Conversidad</h4>
                </div>
          }
          {
            tablaSeleccionada && filaArray
          }
          </div>
        </div>
      </div>
  )
}
