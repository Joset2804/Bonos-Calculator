import {AppContext, AppState} from "./context/appState.js"
import {BrowserRouter as Router,Switch,Route,Link,Routes} from 'react-router-dom'
import Register from "./componentes/register.js"
import Login from "./componentes/login.js"
import ProtectedRoutes from "./protectedRoutes.js";
import Homepage from "./componentes/Homepage.js"
import Sidebar from "./componentes/sidebar.js"
import MisTablas from "./componentes/misTablas.js"

import './css/App.css';
import './css/props.css';

function App() {
  return (
    <div className="App flex">
      <Router>
        <AppState>
          <Routes>
            <Route path="/" element={<Login/>}/>
            <Route path="/register" element={<Register/>}/>
            <Route path="/login" element={<Login/>}/>
            <Route path="/homepage" element={
              <ProtectedRoutes>
                <Sidebar/>
                  <div className="appContent">
                    <Homepage/>
                  </div>
              </ProtectedRoutes>
            }/>
            <Route path="/misTablas" element={
              <ProtectedRoutes>
                <Sidebar/>
                  <div className="appContent">
                    <MisTablas/>
                  </div>
              </ProtectedRoutes>
            }/>
          </Routes>
        </AppState>
      </Router>
    </div>
  );
}

export default App;
