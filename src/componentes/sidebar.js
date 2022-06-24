import React, {useState, useContext} from "react";
import {NavLink} from "react-router-dom";
import {AppContext} from "../context/appState.js"

function Sidebar(){
  const {dataUser, logout, resetOutputs} = useContext(AppContext)

  const [nav, setNav] = useState([
    {label: "Home", slug: "/homepage"},
    {label: "Mis tablas", slug: "/misTablas"}
  ])

  const [currentPage, setCurrentPage] = useState("/")

  let navigation = [];
  for (var i = 0; i < nav.length; i++) {
    navigation.push(
      <li Key={"nav-" + i + "-" + nav[i].slug}>
        <NavLink to={nav[i].slug} className={"link s12 aic noul flex "}>
          <h2 className="lbl">{nav[i].label}</h2>
        </NavLink>
      </li>
    )
  }
  const handleLogout = async () => {
      await logout()
      resetOutputs()
  }
  return(
    <div className="sidebar rel">
      <h1 href="#" className="s24 fontb">Calculadora Bonos</h1>
      <ul className="nav">
        {navigation}
      </ul>
      <div className="miPerfil flex aic">
        <div className="lbl s15 fontb">
          {dataUser.nombres + " " + dataUser.apellidos}
          <h2 className="apodo s13">{"@" + dataUser.nombreUsuario}</h2>
        </div>
      </div>
      <button className="botobCerrarSesion" onClick={handleLogout}>Cerrar Sesion</button>
    </div>
  )
}

export default Sidebar
