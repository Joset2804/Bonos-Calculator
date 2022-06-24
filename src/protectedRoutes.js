import React, {useContext} from "react"
import {AppContext} from "./context/appState.js"
import {Navigate} from "react-router-dom"

function ProtectedRoutes({children}){
  const {user, loading} = useContext(AppContext)

  if (loading) return <p>Loading</p>

  if(!user) return <Navigate to="/login"/>

  return <>{children}</>
}

export default ProtectedRoutes;
