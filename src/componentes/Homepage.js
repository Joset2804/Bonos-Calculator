import React, {useState, useEffect, useContext} from "react";
import {AppContext} from "../context/appState.js"

function Homepage(){
  const {datosIni, setDatosIni, resultados, setResultados, resultadosPA, setResultadosPA, resultadosRatio, setResultadosRatio, resultadosIR, setResultadosIR, nuevaTabla, setNuevaTabla, tablaCreada, resetOutputs, user, logout, dataUser, handleSave} = useContext(AppContext)

  const [bonoActivo, setBonoActivo] = useState("BonoAmericano")

  const handleSaveTabla = async () =>{
    const date = new Date()
    const [month, day, year] = [date.getMonth(), date.getDate(), date.getFullYear()];
    const [hour, minutes, seconds] = [date.getHours(), date.getMinutes(), date.getSeconds()];
    const tablaPack = {
      titulo: "Bono Americano "
              + day + "-" + month + "-" + year + " " + hour + ":"
              + minutes + ":" + seconds + " "
              + datosIni.tipoTasa + " "
              + datosIni.freCupon + " "
              + datosIni.tasaInteres + "%",
      tabla: filaObj,
      fecha: Date()
    }
    await handleSave(tablaPack)
  }

  const calcularResultadosRatio = () => {
    let arrayFAPlazo = filaObj.map((p)=>{return parseFloat(p.FAPlazo)})
    let arrayFlujoAct = filaObj.map((p)=>{return parseFloat(p.flujoAct)})
    let sumArrayFAPlazo = arrayFAPlazo.reduce((acc, curr)=>{return acc + curr})
    let sumFlujoAct = arrayFlujoAct.reduce((acc, curr)=>{return acc + curr})
    resultadosRatio.duracion = sumArrayFAPlazo / sumFlujoAct
    let duracion = sumArrayFAPlazo / sumFlujoAct
    //Convexidad
    let arrayFactorConvex = filaObj.map((p)=>{return parseFloat(p.factorConversidad)})
    let sumArrayFactorConvex = arrayFactorConvex.reduce((acc, curr)=>{return acc + curr})
    resultadosRatio.convexidad = sumArrayFactorConvex/(Math.pow(1+resultados.cokMensual,2)*sumFlujoAct*Math.pow(datosIni.diasAno/resultados.frecuenciaCupon,2))
    let convexidad = sumArrayFactorConvex/(Math.pow(1+resultados.cokMensual,2)*sumFlujoAct*Math.pow(datosIni.diasAno/resultados.frecuenciaCupon,2))

    //total
    resultadosRatio.total = resultadosRatio.duracion + resultadosRatio.convexidad
    //duracion Modificada
    resultadosRatio.duracionModificada = resultadosRatio.duracion / (1+resultados.cokMensual)
  }

  const calcularIndicadoresRentabilidad = () => {
    //INDICADORES DE RENTABILIDAD
    //TCEA EMISOR
    let arrayTir = []
    let arrayFlujoEmisor = filaObj.map((p)=>{return parseFloat(p.flujoEmisor)})
    arrayTir = [(arrayFlujoEmisor.shift() * -1), ...arrayFlujoEmisor]
    resultadosIR.tceaEmisor = Math.pow(IRR(arrayTir)+1, (datosIni.diasAno/resultados.frecuenciaCupon))-1

    //TCEA EMISOR ESCUDO
    arrayTir = []
    let arrayFlujoEmisorEscudo = filaObj.map((p)=>{return parseFloat(p.flujoEmisorEscudo)})
    arrayTir = [(arrayFlujoEmisorEscudo.shift() * -1), ...arrayFlujoEmisorEscudo]
    resultadosIR.tceaEmisorEscudo = Math.pow(IRR(arrayTir)+1, (datosIni.diasAno/resultados.frecuenciaCupon))-1

    //TREA BONISTA
    arrayTir = []
    let arrayFlujoBonista = filaObj.map((p)=>{return parseFloat(p.flujoBonista)})
    arrayTir = [(arrayFlujoBonista.shift()), ...arrayFlujoBonista]
    resultadosIR.treaBonista = Math.pow(IRR(arrayTir)+1, (datosIni.diasAno/resultados.frecuenciaCupon))-1
  }

  const calcularPrecioActualUtilidad = () => {
    //PRECIO ACTUAL
    let arrayVan = []
    let arrayBonista = filaObj.map((p)=>{return parseFloat(p.flujoBonista)})
    let primerItenArrayBonista = arrayBonista.shift()
    arrayVan = [...arrayBonista]
    resultadosPA.precioActual = (-1) * getNPV(resultados.cokMensual * 100, 0, arrayVan)

    //UTILIDAD PERDIDA
    resultadosPA.utilidadPerdida = ((-1) * getNPV(resultados.cokMensual * 100, 0, arrayVan)) - primerItenArrayBonista
  }

  const handleBorrarNuevaTabla = () => {
    resetOutputs()
  }

  const handleChange = (e) => {
    if(nuevaTabla === true){setNuevaTabla(false)}
    setDatosIni({...datosIni, [e.target.name] : e.target.value})
  }

  const handleTipoBono = (e) => {
    setBonoActivo(e.target.name)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setNuevaTabla(true)

    //FRECUENCIA DE CUPON
    let frecuenciaCupon = 0
    datosIni.freCupon == "bimestral" ? frecuenciaCupon = 60 :
    datosIni.freCupon == "trimestral" ? frecuenciaCupon = 90 :
    datosIni.freCupon == "cuatrimestral" ? frecuenciaCupon = 120 :
    datosIni.freCupon == "semestral" ? frecuenciaCupon = 180 :
    datosIni.freCupon == "anual" ? frecuenciaCupon = 360 : frecuenciaCupon = 30

    //DIAS DE CAPITALIZACION
    let diasCapitalizacion = 0
    datosIni.capitalizacion == "quincenal" ? diasCapitalizacion = 15 :
    datosIni.capitalizacion == "mensual" ? diasCapitalizacion = 30 :
    datosIni.capitalizacion == "bimestral" ? diasCapitalizacion = 60 :
    datosIni.capitalizacion == "trimestral" ? diasCapitalizacion = 90 :
    datosIni.capitalizacion == "cuatrimestral" ? diasCapitalizacion = 120 :
    datosIni.capitalizacion == "semestral" ? diasCapitalizacion = 180 :
    datosIni.capitalizacion == "anual" ? diasCapitalizacion = 360 : diasCapitalizacion = 1

    //NUMERO PERIODOS POR ANO
    let numPeriodosAno = datosIni.diasAno / frecuenciaCupon
    //NUMERO TOTAL DE PERIODOS
    let numTotalPeriodos = datosIni.numeroAnos * numPeriodosAno
    //TASA EFECTIVA ANUAL
    let tasaEfectivaAnual = 0
    if (datosIni.tipoTasa == "efectiva") {
      tasaEfectivaAnual = datosIni.tasaInteres/100
    }else {
      tasaEfectivaAnual = Math.pow((1+((datosIni.tasaInteres/100)/(datosIni.diasAno/diasCapitalizacion))), (datosIni.diasAno/diasCapitalizacion))-1
    }
    //TASA EFECTIVA MENSUAL
    let tasaEfectivaMensual = Math.pow((1+tasaEfectivaAnual), (frecuenciaCupon/datosIni.diasAno))-1
    //COK MENSUAL
    let cokMensual = Math.pow((1+(datosIni.tasaDescuento/100)), (frecuenciaCupon/datosIni.diasAno))-1
    //COSTES INICIALES EMISOR
    let costesIniEmisor = ((parseFloat(datosIni.estructuracion) + parseFloat(datosIni.colocacion) + parseFloat(datosIni.flotacion) + parseFloat(datosIni.cavali))/100) * datosIni.valorComercial
    //COSTeS INICIALES BONISTA
    let costesIniBonista = ((parseFloat(datosIni.flotacion) + parseFloat(datosIni.cavali))/100) * datosIni.valorComercial

    setResultados({
      frecuenciaCupon, diasCapitalizacion,
      numPeriodosAno, numTotalPeriodos,
      tasaEfectivaAnual, tasaEfectivaMensual,
      cokMensual, costesIniEmisor,
      costesIniBonista
    })
  }

  //FUNCION PARA Fecha TABLA
  function sumaDiasFecha (fecha, n=0) {
    let sum = new Date(fecha.setDate(fecha.getDate()+n))
    let format = sum.getDate() + "/" + (sum.getMonth()+1) + "/" + sum.getFullYear()
    return format
  }

  //VARIABLES PARA CREAR FILAS
  let filaObj = []
  let filaArray = []
  let filaAnterior = {}

  //FUNCION PARA TIR
  function IRR(values, guess) {
  // Credits: algorithm inspired by Apache OpenOffice

  // Calculates the resulting amount
  var irrResult = function(values, dates, rate) {
    var r = rate + 1;
    var result = values[0];
    for (var i = 1; i < values.length; i++) {
      result += values[i] / Math.pow(r, (dates[i] - dates[0]) / 365);
    }
    return result;
  }

  // Calculates the first derivation
  var irrResultDeriv = function(values, dates, rate) {
    var r = rate + 1;
    var result = 0;
    for (var i = 1; i < values.length; i++) {
      var frac = (dates[i] - dates[0]) / 365;
      result -= frac * values[i] / Math.pow(r, frac + 1);
    }
    return result;
  }

  // Initialize dates and check that values contains at least one positive value and one negative value
  var dates = [];
  var positive = false;
  var negative = false;
  for (var i = 0; i < values.length; i++) {
    dates[i] = (i === 0) ? 0 : dates[i - 1] + 365;
    if (values[i] > 0) positive = true;
    if (values[i] < 0) negative = true;
  }

  // Return error if values does not contain at least one positive value and one negative value
  if (!positive || !negative) return '#NUM!';

  // Initialize guess and resultRate
  var guess = (typeof guess === 'undefined') ? 0.1 : guess;
  var resultRate = guess;

  // Set maximum epsilon for end of iteration
  var epsMax = 1e-10;

  // Set maximum number of iterations
  var iterMax = 50;

  // Implement Newton's method
  var newRate, epsRate, resultValue;
  var iteration = 0;
  var contLoop = true;
  do {
    resultValue = irrResult(values, dates, resultRate);
    newRate = resultRate - resultValue / irrResultDeriv(values, dates, resultRate);
    epsRate = Math.abs(newRate - resultRate);
    resultRate = newRate;
    contLoop = (epsRate > epsMax) && (Math.abs(resultValue) > epsMax);
  } while(contLoop && (++iteration < iterMax));

  if(contLoop) return '#NUM!';

  // Return internal rate of return
  return resultRate;
}
  //FUNCION PARA VAN
  function getNPV(rate, initialCost, cashFlows) {
    var npv = initialCost;
    for (var i = 0; i < cashFlows.length; i++) {
      npv += cashFlows[i] / Math.pow(rate / 100 + 1, i + 1);
      }
      return npv;
    }

  //FUNCION CREAR TABLA BONO AMERICANO
  const bonoAmericano = () => {
    if(nuevaTabla === true){
      let fechaProgramadaAno = datosIni.fechaEmision.slice(0,4)
      let fechaProgramadaMes = datosIni.fechaEmision.slice(5,7)
      let fechaProgramadaDia = datosIni.fechaEmision.slice(8)
      let fechaInicialTabla = new Date(fechaProgramadaAno, fechaProgramadaMes-1, fechaProgramadaDia)

      filaObj = [{
        index: 0,
        fechaProgramada:sumaDiasFecha(fechaInicialTabla, 0),
        inflacionAnual: 0,
        inflacionSemestral: 0,
        plazoGracia: "",
        bono: datosIni.valorNominal,
        bonoIndexado: datosIni.valorNominal * (1 + 0),
        amortizacion: 0,
        prima: 0,
        cuponInteres: 0,
        cuota: 0,
        escudo: 0,
        flujoEmisor: datosIni.valorComercial - resultados.costesIniEmisor,
        flujoEmisorEscudo: datosIni.valorComercial - resultados.costesIniEmisor,
        flujoBonista: parseFloat(datosIni.valorComercial) + parseFloat(resultados.costesIniBonista),
        flujoAct: 0,
        FAPlazo: 0,
        factorConversidad: 0
      }]
      filaArray = []
      filaAnterior = {}

      for (var j = 1; j <= Math.floor(resultados.numTotalPeriodos); j++) {
        if (j == 1) {
          let fila = {
            index: j,
            fechaProgramada:sumaDiasFecha(fechaInicialTabla, resultados.frecuenciaCupon),
            inflacionAnual: 0,
            inflacionSemestral: 0,
            plazoGracia: "S",
            bono: filaObj[0].bonoIndexado + filaObj[0].amortizacion,
            bonoIndexado: (filaObj[0].bonoIndexado + filaObj[0].amortizacion) * (1+0),
            amortizacion: 0,
            prima: 0,
            cuponInteres: datosIni.valorNominal * resultados.tasaEfectivaMensual,
            cuota: (datosIni.valorNominal * resultados.tasaEfectivaMensual) + 0,
            escudo: (datosIni.valorNominal * resultados.tasaEfectivaMensual) * (datosIni.impuestoRenta/100),
            flujoEmisor: ((datosIni.valorNominal * resultados.tasaEfectivaMensual) + 0) + 0,
            flujoEmisorEscudo: (datosIni.valorNominal * resultados.tasaEfectivaMensual) - ((datosIni.valorNominal * resultados.tasaEfectivaMensual) * (datosIni.impuestoRenta/100)),
            flujoBonista: (-1) * (((datosIni.valorNominal * resultados.tasaEfectivaMensual) + 0) + 0),
            flujoAct: ((-1) * (((datosIni.valorNominal * resultados.tasaEfectivaMensual) + 0) + 0))/(Math.pow((1+resultados.cokMensual),j)),
            FAPlazo: (((-1) * (((datosIni.valorNominal * resultados.tasaEfectivaMensual) + 0) + 0))/(Math.pow((1+resultados.cokMensual),j))) * j * (resultados.frecuenciaCupon/datosIni.diasAno),
            factorConversidad: ((-1) * (((datosIni.valorNominal * resultados.tasaEfectivaMensual) + 0) + 0))/(Math.pow((1+resultados.cokMensual),j)) * j * (1 + j)
          }
          filaAnterior = {}
          filaAnterior = {...fila}
          filaObj.push(fila)
        } else if(j > 1 && j < Math.floor(resultados.numTotalPeriodos)) {
          let fila = {
            index: j,
            fechaProgramada:sumaDiasFecha(fechaInicialTabla, resultados.frecuenciaCupon),
            inflacionAnual: 0,
            plazoGracia: "S",
            inflacionSemestral: 0,
            bono: filaAnterior.bonoIndexado + filaAnterior.amortizacion,
            bonoIndexado: (filaAnterior.bonoIndexado + filaAnterior.amortizacion) * (1+0),
            amortizacion: 0,
            prima: 0,
            cuponInteres: datosIni.valorNominal * resultados.tasaEfectivaMensual,
            cuota: (datosIni.valorNominal * resultados.tasaEfectivaMensual) + 0,
            escudo: (datosIni.valorNominal * resultados.tasaEfectivaMensual) * (datosIni.impuestoRenta/100),
            flujoEmisor: ((datosIni.valorNominal * resultados.tasaEfectivaMensual) + 0) + 0,
            flujoEmisorEscudo: (datosIni.valorNominal * resultados.tasaEfectivaMensual) - ((datosIni.valorNominal * resultados.tasaEfectivaMensual) * (datosIni.impuestoRenta/100)),
            flujoBonista: (-1) * (((datosIni.valorNominal * resultados.tasaEfectivaMensual) + 0) + 0),
            flujoAct: ((-1) * (((datosIni.valorNominal * resultados.tasaEfectivaMensual) + 0) + 0))/(Math.pow((1+resultados.cokMensual),j)),
            FAPlazo: (((-1) * (((datosIni.valorNominal * resultados.tasaEfectivaMensual) + 0) + 0))/(Math.pow((1+resultados.cokMensual),j))) * j * (resultados.frecuenciaCupon/datosIni.diasAno),
            factorConversidad: ((-1) * (((datosIni.valorNominal * resultados.tasaEfectivaMensual) + 0) + 0))/(Math.pow((1+resultados.cokMensual),j)) * j * (1 + j)
          }
          filaAnterior = {}
          filaAnterior = {...fila}
          filaObj.push(fila)
        } else {
          let fila = {
            index: j,
            fechaProgramada:sumaDiasFecha(fechaInicialTabla, resultados.frecuenciaCupon),
            inflacionAnual: 0,
            inflacionSemestral: 0,
            plazoGracia: "S",
            bono: filaObj[0].bonoIndexado + filaObj[0].amortizacion,
            bonoIndexado: (filaObj[0].bonoIndexado + filaObj[0].amortizacion) * (1+0),
            amortizacion: (filaObj[0].bonoIndexado + filaObj[0].amortizacion) * (1+0),
            prima: (datosIni.prima/100) * datosIni.valorNominal,
            cuponInteres: datosIni.valorNominal * resultados.tasaEfectivaMensual,
            cuota: (datosIni.valorNominal * resultados.tasaEfectivaMensual) + ((filaObj[0].bonoIndexado + filaObj[0].amortizacion) * (1+0)),
            escudo: (datosIni.valorNominal * resultados.tasaEfectivaMensual) * (datosIni.impuestoRenta/100),
            flujoEmisor: ((datosIni.valorNominal * resultados.tasaEfectivaMensual) + ((filaObj[0].bonoIndexado + filaObj[0].amortizacion) * (1+0))) + ((datosIni.prima/100) * datosIni.valorNominal),
            flujoEmisorEscudo: (((datosIni.valorNominal * resultados.tasaEfectivaMensual) + ((filaObj[0].bonoIndexado + filaObj[0].amortizacion) * (1+0))) + ((datosIni.prima/100) * datosIni.valorNominal)) - ((datosIni.valorNominal * resultados.tasaEfectivaMensual) * (datosIni.impuestoRenta/100)),
            flujoBonista: (-1) * (((datosIni.valorNominal * resultados.tasaEfectivaMensual) + ((filaObj[0].bonoIndexado + filaObj[0].amortizacion) * (1+0))) + ((datosIni.prima/100) * datosIni.valorNominal)),
            flujoAct: ((-1) * (((datosIni.valorNominal * resultados.tasaEfectivaMensual) + ((filaObj[0].bonoIndexado + filaObj[0].amortizacion) * (1+0))) + ((datosIni.prima/100) * datosIni.valorNominal)))/Math.pow((1+resultados.cokMensual), j),
            FAPlazo: (((-1) * (((datosIni.valorNominal * resultados.tasaEfectivaMensual) + ((filaObj[0].bonoIndexado + filaObj[0].amortizacion) * (1+0))) + ((datosIni.prima/100) * datosIni.valorNominal)))/Math.pow((1+resultados.cokMensual), j)) * j * (resultados.frecuenciaCupon/datosIni.diasAno),
            factorConversidad: (((-1) * (((datosIni.valorNominal * resultados.tasaEfectivaMensual) + ((filaObj[0].bonoIndexado + filaObj[0].amortizacion) * (1+0))) + ((datosIni.prima/100) * datosIni.valorNominal)))/Math.pow((1+resultados.cokMensual), j)) * j * (1+j)
          }
          filaAnterior = {};
          filaObj.push(fila);
        }
      }
      for (var i = 0; i < filaObj.length; i++) {
        filaArray.push(
          <ul className="fila flex">
            <li className="itemFila">{filaObj[i].index}</li>
            <li className="itemFila">{filaObj[i].fechaProgramada}</li>
            <li className="itemFila">{filaObj[i].inflacionAnual.toFixed(2)}</li>
            <li className="itemFila">{filaObj[i].inflacionSemestral.toFixed(2)}</li>
            <li className="itemFila">{filaObj[i].plazoGracia}</li>
            <li className="itemFila">{filaObj[i].bono}</li>
            <li className="itemFila">{filaObj[i].bonoIndexado}</li>
            <li className="itemFila">{filaObj[i].amortizacion.toFixed(2)}</li>
            <li className="itemFila">{filaObj[i].prima.toFixed(2)}</li>
            <li className="itemFila">{filaObj[i].cuponInteres.toFixed(2) * (-1)}</li>
            <li className="itemFila">{filaObj[i].cuota.toFixed(2) * (-1)}</li>
            <li className="itemFila">{filaObj[i].escudo.toFixed(2)}</li>
            <li className="itemFila">{filaObj[i].flujoEmisor.toFixed(2) * (-1)}</li>
            <li className="itemFila">{filaObj[i].flujoEmisorEscudo.toFixed(2) * (-1)}</li>
            <li className="itemFila">{filaObj[i].flujoBonista.toFixed(2) * (-1)}</li>
            <li className="itemFila">{filaObj[i].flujoAct.toFixed(2) * (-1)}</li>
            <li className="itemFila">{filaObj[i].FAPlazo.toFixed(2) * (-1)}</li>
            <li className="itemFila">{filaObj[i].factorConversidad.toFixed(2) * (-1)}</li>
          </ul>
        )
      }
      calcularResultadosRatio()
      calcularPrecioActualUtilidad()
      calcularIndicadoresRentabilidad()
    }
    return filaArray
  }

  //FUNCION CREAR TABLA BONO FRANCES
  const bonoFrances = () => {
    let fechaProgramadaAno = datosIni.fechaEmision.slice(0,4)
    let fechaProgramadaMes = datosIni.fechaEmision.slice(5,7)
    let fechaProgramadaDia = datosIni.fechaEmision.slice(8)
    let fechaInicialTabla = new Date(fechaProgramadaAno, fechaProgramadaMes-1, fechaProgramadaDia)

    if (nuevaTabla === true) {
      filaObj = [{
        index: 0,
        fechaProgramada:sumaDiasFecha(fechaInicialTabla, 0),
        inflacionAnual: 0,
        inflacionSemestral: 0,
        plazoGracia: "",
        bono: parseFloat(datosIni.valorNominal),
        bonoIndexado: parseFloat(datosIni.valorNominal * (1 + 0)),
        amortizacion: 0,
        prima: 0,
        cuponInteres: 0,
        cuota: 0,
        escudo: 0,
        flujoEmisor: datosIni.valorComercial - resultados.costesIniEmisor,
        flujoEmisorEscudo: datosIni.valorComercial - resultados.costesIniEmisor,
        flujoBonista: parseFloat(datosIni.valorComercial) + parseFloat(resultados.costesIniBonista),
        flujoAct: 0,
        FAPlazo: 0,
        factorConversidad: 0
      }]

      filaArray = []

      filaAnterior = {}

      for (var j = 1; j <= Math.floor(resultados.numTotalPeriodos); j++) {
        if (j == 1) {
          let fila = {
            index: j,
            fechaProgramada:sumaDiasFecha(fechaInicialTabla, resultados.frecuenciaCupon),
            inflacionAnual: 0,
            inflacionSemestral: 0,
            plazoGracia: "S",
            bono: parseFloat(datosIni.valorNominal),
            bonoIndexado: parseFloat((datosIni.valorNominal) * (1+0)),
            amortizacion: (datosIni.valorNominal * ((resultados.tasaEfectivaMensual * Math.pow((1+resultados.tasaEfectivaMensual),(resultados.numTotalPeriodos-j+1))))/(Math.pow((1+resultados.tasaEfectivaMensual),(resultados.numTotalPeriodos-j+1))-1)) - (datosIni.valorNominal * resultados.tasaEfectivaMensual),
            prima: 0,
            cuponInteres: datosIni.valorNominal * resultados.tasaEfectivaMensual,
            cuota: datosIni.valorNominal * ((resultados.tasaEfectivaMensual * Math.pow((1+resultados.tasaEfectivaMensual),(resultados.numTotalPeriodos-j+1))))/(Math.pow((1+resultados.tasaEfectivaMensual),(resultados.numTotalPeriodos-j+1))-1),
            escudo: (datosIni.valorNominal * resultados.tasaEfectivaMensual) * (datosIni.impuestoRenta/100),
            flujoEmisor: datosIni.valorNominal * ((resultados.tasaEfectivaMensual * Math.pow((1+resultados.tasaEfectivaMensual),(resultados.numTotalPeriodos-j+1))))/(Math.pow((1+resultados.tasaEfectivaMensual),(resultados.numTotalPeriodos-j+1))-1) + 0,
            flujoEmisorEscudo: (datosIni.valorNominal * ((resultados.tasaEfectivaMensual * Math.pow((1+resultados.tasaEfectivaMensual),(resultados.numTotalPeriodos-j+1))))/(Math.pow((1+resultados.tasaEfectivaMensual),(resultados.numTotalPeriodos-j+1))-1)) - ((datosIni.valorNominal * resultados.tasaEfectivaMensual) * (datosIni.impuestoRenta/100)),
            flujoBonista: (-1) * (datosIni.valorNominal * ((resultados.tasaEfectivaMensual * Math.pow((1+resultados.tasaEfectivaMensual),(resultados.numTotalPeriodos-j+1))))/(Math.pow((1+resultados.tasaEfectivaMensual),(resultados.numTotalPeriodos-j+1))-1) + 0),
            flujoAct: ((-1) * (datosIni.valorNominal * ((resultados.tasaEfectivaMensual * Math.pow((1+resultados.tasaEfectivaMensual),(resultados.numTotalPeriodos-j+1))))/(Math.pow((1+resultados.tasaEfectivaMensual),(resultados.numTotalPeriodos-j+1))-1) + 0))/(Math.pow((1+resultados.cokMensual), j)),
            FAPlazo: (((-1) * (datosIni.valorNominal * ((resultados.tasaEfectivaMensual * Math.pow((1+resultados.tasaEfectivaMensual),(resultados.numTotalPeriodos-j+1))))/(Math.pow((1+resultados.tasaEfectivaMensual),(resultados.numTotalPeriodos-j+1))-1) + 0))/(Math.pow((1+resultados.cokMensual), j))) * j * ((resultados.frecuenciaCupon)/(datosIni.diasAno)),
            factorConversidad: (((-1) * (datosIni.valorNominal * ((resultados.tasaEfectivaMensual * Math.pow((1+resultados.tasaEfectivaMensual),(resultados.numTotalPeriodos-j+1))))/(Math.pow((1+resultados.tasaEfectivaMensual),(resultados.numTotalPeriodos-j+1))-1) + 0))/(Math.pow((1+resultados.cokMensual), j))) * j * (1 + j)
          }
          filaAnterior = {}
          filaAnterior = {...fila}
          filaObj.push(fila)
        } else if(j > 1 && j < Math.floor(resultados.numTotalPeriodos)) {
          let fila = {
            index: j,
            fechaProgramada:sumaDiasFecha(fechaInicialTabla, resultados.frecuenciaCupon),
            inflacionAnual: 0,
            plazoGracia: "S",
            inflacionSemestral: 0,
            bono: filaAnterior.bonoIndexado - filaAnterior.amortizacion,
            bonoIndexado: (filaAnterior.bonoIndexado - filaAnterior.amortizacion) * (1+0),
            amortizacion: (datosIni.valorNominal * ((resultados.tasaEfectivaMensual * Math.pow((1+resultados.tasaEfectivaMensual),(resultados.numTotalPeriodos-1+1))))/(Math.pow((1+resultados.tasaEfectivaMensual),(resultados.numTotalPeriodos-1+1))-1)) - (((filaAnterior.bonoIndexado - filaAnterior.amortizacion) * 1+0) * resultados.tasaEfectivaMensual),
            prima: 0,
            cuponInteres: ((filaAnterior.bonoIndexado - filaAnterior.amortizacion) * 1+0) * resultados.tasaEfectivaMensual,
            cuota: datosIni.valorNominal * ((resultados.tasaEfectivaMensual * Math.pow((1+resultados.tasaEfectivaMensual),(resultados.numTotalPeriodos-1+1))))/(Math.pow((1+resultados.tasaEfectivaMensual),(resultados.numTotalPeriodos-1+1))-1),
            escudo: (((filaAnterior.bonoIndexado - filaAnterior.amortizacion) * 1+0) * resultados.tasaEfectivaMensual) * (datosIni.impuestoRenta/100),
            flujoEmisor: (datosIni.valorNominal * ((resultados.tasaEfectivaMensual * Math.pow((1+resultados.tasaEfectivaMensual),(resultados.numTotalPeriodos-1+1))))/(Math.pow((1+resultados.tasaEfectivaMensual),(resultados.numTotalPeriodos-1+1))-1)) + 0,
            flujoEmisorEscudo: ((datosIni.valorNominal * ((resultados.tasaEfectivaMensual * Math.pow((1+resultados.tasaEfectivaMensual),(resultados.numTotalPeriodos-1+1))))/(Math.pow((1+resultados.tasaEfectivaMensual),(resultados.numTotalPeriodos-1+1))-1)) + 0) - ((((filaAnterior.bonoIndexado - filaAnterior.amortizacion) * 1+0) * resultados.tasaEfectivaMensual) * (datosIni.impuestoRenta/100)),
            flujoBonista: (-1) * (datosIni.valorNominal * ((resultados.tasaEfectivaMensual * Math.pow((1+resultados.tasaEfectivaMensual),(resultados.numTotalPeriodos-1+1))))/(Math.pow((1+resultados.tasaEfectivaMensual),(resultados.numTotalPeriodos-1+1))-1)) + 0,
            flujoAct: ((-1) * (datosIni.valorNominal * ((resultados.tasaEfectivaMensual * Math.pow((1+resultados.tasaEfectivaMensual),(resultados.numTotalPeriodos-1+1))))/(Math.pow((1+resultados.tasaEfectivaMensual),(resultados.numTotalPeriodos-1+1))-1)) + 0) / Math.pow((1+resultados.cokMensual),(j)),
            FAPlazo: (((-1) * (datosIni.valorNominal * ((resultados.tasaEfectivaMensual * Math.pow((1+resultados.tasaEfectivaMensual),(resultados.numTotalPeriodos-1+1))))/(Math.pow((1+resultados.tasaEfectivaMensual),(resultados.numTotalPeriodos-1+1))-1)) + 0) / Math.pow((1+resultados.cokMensual),(j))) * j * (resultados.frecuenciaCupon)/(datosIni.diasAno),
            factorConversidad: (((-1) * (datosIni.valorNominal * ((resultados.tasaEfectivaMensual * Math.pow((1+resultados.tasaEfectivaMensual),(resultados.numTotalPeriodos-1+1))))/(Math.pow((1+resultados.tasaEfectivaMensual),(resultados.numTotalPeriodos-1+1))-1)) + 0) / Math.pow((1+resultados.cokMensual),(j))) * j * (1 + j)
          }
          filaAnterior = {}
          filaAnterior = {...fila}
          filaObj.push(fila)
        } else {
          let fila = {
            index: j,
            fechaProgramada:sumaDiasFecha(fechaInicialTabla, resultados.frecuenciaCupon),
            inflacionAnual: 0,
            inflacionSemestral: 0,
            plazoGracia: "S",
            bono: filaAnterior.bonoIndexado - filaAnterior.amortizacion,
            bonoIndexado: (filaAnterior.bonoIndexado - filaAnterior.amortizacion) * (1+0),
            amortizacion: (datosIni.valorNominal * ((resultados.tasaEfectivaMensual * Math.pow((1+resultados.tasaEfectivaMensual),(resultados.numTotalPeriodos-1+1))))/(Math.pow((1+resultados.tasaEfectivaMensual),(resultados.numTotalPeriodos-1+1))-1)) - (((filaAnterior.bonoIndexado - filaAnterior.amortizacion) * 1+0) * resultados.tasaEfectivaMensual),
            prima: (datosIni.prima/100) * ((filaAnterior.bonoIndexado - filaAnterior.amortizacion) * (1+0)),
            cuponInteres: ((filaAnterior.bonoIndexado - filaAnterior.amortizacion) * 1+0) * resultados.tasaEfectivaMensual,
            cuota: datosIni.valorNominal * ((resultados.tasaEfectivaMensual * Math.pow((1+resultados.tasaEfectivaMensual),(resultados.numTotalPeriodos-1+1))))/(Math.pow((1+resultados.tasaEfectivaMensual),(resultados.numTotalPeriodos-1+1))-1),
            escudo: (((filaAnterior.bonoIndexado - filaAnterior.amortizacion) * 1+0) * resultados.tasaEfectivaMensual) * (datosIni.impuestoRenta/100),
            flujoEmisor: (datosIni.valorNominal * ((resultados.tasaEfectivaMensual * Math.pow((1+resultados.tasaEfectivaMensual),(resultados.numTotalPeriodos-1+1))))/(Math.pow((1+resultados.tasaEfectivaMensual),(resultados.numTotalPeriodos-1+1))-1)) + ((datosIni.prima/100) * ((filaAnterior.bonoIndexado - filaAnterior.amortizacion) * (1+0))),
            flujoEmisorEscudo: ((datosIni.valorNominal * ((resultados.tasaEfectivaMensual * Math.pow((1+resultados.tasaEfectivaMensual),(resultados.numTotalPeriodos-1+1))))/(Math.pow((1+resultados.tasaEfectivaMensual),(resultados.numTotalPeriodos-1+1))-1)) + ((datosIni.prima/100) * ((filaAnterior.bonoIndexado - filaAnterior.amortizacion) * (1+0)))) - ((((filaAnterior.bonoIndexado - filaAnterior.amortizacion) * 1+0) * resultados.tasaEfectivaMensual) * (datosIni.impuestoRenta/100)),
            flujoBonista: (-1) * ((datosIni.valorNominal * ((resultados.tasaEfectivaMensual * Math.pow((1+resultados.tasaEfectivaMensual),(resultados.numTotalPeriodos-1+1))))/(Math.pow((1+resultados.tasaEfectivaMensual),(resultados.numTotalPeriodos-1+1))-1)) + ((datosIni.prima/100) * ((filaAnterior.bonoIndexado - filaAnterior.amortizacion) * (1+0)))),
            flujoAct: (-1) * ((datosIni.valorNominal * ((resultados.tasaEfectivaMensual * Math.pow((1+resultados.tasaEfectivaMensual),(resultados.numTotalPeriodos-1+1))))/(Math.pow((1+resultados.tasaEfectivaMensual),(resultados.numTotalPeriodos-1+1))-1)) + ((datosIni.prima/100) * ((filaAnterior.bonoIndexado - filaAnterior.amortizacion) * (1+0)))) / (Math.pow((1 + resultados.cokMensual),j)),
            FAPlazo: (-1) * (((datosIni.valorNominal * ((resultados.tasaEfectivaMensual * Math.pow((1+resultados.tasaEfectivaMensual),(resultados.numTotalPeriodos-1+1))))/(Math.pow((1+resultados.tasaEfectivaMensual),(resultados.numTotalPeriodos-1+1))-1)) + ((datosIni.prima/100) * ((filaAnterior.bonoIndexado - filaAnterior.amortizacion) * (1+0)))) / (Math.pow((1 + resultados.cokMensual),j))) * j * (resultados.frecuenciaCupon/datosIni.diasAno),
            factorConversidad: (-1) * (((datosIni.valorNominal * ((resultados.tasaEfectivaMensual * Math.pow((1+resultados.tasaEfectivaMensual),(resultados.numTotalPeriodos-1+1))))/(Math.pow((1+resultados.tasaEfectivaMensual),(resultados.numTotalPeriodos-1+1))-1)) + ((datosIni.prima/100) * ((filaAnterior.bonoIndexado - filaAnterior.amortizacion) * (1+0)))) / (Math.pow((1 + resultados.cokMensual),j))) * j * (1+j)
          }
          filaAnterior = {};
          filaObj.push(fila);
        }
      }

      for (var i = 0; i < filaObj.length; i++) {
        filaArray.push(
          <ul className="fila flex">
            <li className="itemFila">{filaObj[i].index}</li>
            <li className="itemFila">{filaObj[i].fechaProgramada}</li>
            <li className="itemFila">{filaObj[i].inflacionAnual.toFixed(2)}</li>
            <li className="itemFila">{filaObj[i].inflacionSemestral.toFixed(2)}</li>
            <li className="itemFila">{filaObj[i].plazoGracia}</li>
            <li className="itemFila">{filaObj[i].bono.toFixed(2)}</li>
            <li className="itemFila">{filaObj[i].bonoIndexado.toFixed(2)}</li>
            <li className="itemFila">{filaObj[i].amortizacion.toFixed(2) * (-1)}</li>
            <li className="itemFila">{filaObj[i].prima.toFixed(2)}</li>
            <li className="itemFila">{filaObj[i].cuponInteres.toFixed(2) * (-1)}</li>
            <li className="itemFila">{filaObj[i].cuota.toFixed(2) * (-1)}</li>
            <li className="itemFila">{filaObj[i].escudo.toFixed(2)}</li>
            <li className="itemFila">{filaObj[i].flujoEmisor.toFixed(2) * (-1)}</li>
            <li className="itemFila">{filaObj[i].flujoEmisorEscudo.toFixed(2) * (-1)}</li>
            <li className="itemFila">{filaObj[i].flujoBonista.toFixed(2) * (-1)}</li>
            <li className="itemFila">{filaObj[i].flujoAct.toFixed(2) * (-1)}</li>
            <li className="itemFila">{filaObj[i].FAPlazo.toFixed(2) * (-1)}</li>
            <li className="itemFila">{filaObj[i].factorConversidad.toFixed(2) * (-1)}</li>
          </ul>
        )
      }
      calcularResultadosRatio()
      calcularPrecioActualUtilidad()
      calcularIndicadoresRentabilidad()
    }
    return filaArray
  }

  //FUNCION CREAR TABLA BONO ALEMAN
  const bonoAleman = () => {
    let fechaProgramadaAno = datosIni.fechaEmision.slice(0,4)
    let fechaProgramadaMes = datosIni.fechaEmision.slice(5,7)
    let fechaProgramadaDia = datosIni.fechaEmision.slice(8)
    let fechaInicialTabla = new Date(fechaProgramadaAno, fechaProgramadaMes-1, fechaProgramadaDia)

    if(nuevaTabla === true){
      filaObj = [{
        index: 0,
        fechaProgramada:sumaDiasFecha(fechaInicialTabla, 0),
        inflacionAnual: 0,
        inflacionSemestral: 0,
        plazoGracia: "",
        bono: 0,
        bonoIndexado: 0,
        amortizacion: 0,
        prima: 0,
        cuponInteres: 0,
        cuota: 0,
        escudo: 0,
        flujoEmisor: datosIni.valorComercial - resultados.costesIniEmisor,
        flujoEmisorEscudo: datosIni.valorComercial - resultados.costesIniEmisor,
        flujoBonista: parseFloat(datosIni.valorComercial) + parseFloat(resultados.costesIniBonista),
        flujoAct: 0,
        FAPlazo: 0,
        factorConversidad: 0
      }]

      filaArray = []

      filaAnterior = {}

      for (var j = 1; j <= Math.floor(resultados.numTotalPeriodos); j++) {
        if (j == 1) {
          let fila = {
            index: j,
            fechaProgramada:sumaDiasFecha(fechaInicialTabla, resultados.frecuenciaCupon),
            inflacionAnual: 0,
            inflacionSemestral: 0,
            plazoGracia: "S",
            amortizacion: ((parseFloat(datosIni.valorNominal) + filaObj[0].amortizacion) * (1+0))/(Math.floor(resultados.numTotalPeriodos) - j + 1),
            bono: datosIni.valorNominal,
            bonoIndexado: parseFloat(datosIni.valorNominal),
            prima: 0,
            cuponInteres: datosIni.valorNominal * resultados.tasaEfectivaMensual,
            cuota: (datosIni.valorNominal * resultados.tasaEfectivaMensual) + ((parseFloat(datosIni.valorNominal) + filaObj[0].amortizacion) * (1+0))/(Math.floor(resultados.numTotalPeriodos) - j + 1),
            escudo: (datosIni.valorNominal * resultados.tasaEfectivaMensual) * (datosIni.impuestoRenta/100),
            flujoEmisor: ((datosIni.valorNominal * resultados.tasaEfectivaMensual) + ((parseFloat(datosIni.valorNominal) + filaObj[0].amortizacion) * (1+0))/(Math.floor(resultados.numTotalPeriodos) - j + 1)) + 0,
            flujoEmisorEscudo: (((datosIni.valorNominal * resultados.tasaEfectivaMensual) + ((parseFloat(datosIni.valorNominal) + filaObj[0].amortizacion) * (1+0))/(Math.floor(resultados.numTotalPeriodos) - j + 1)) + 0) - ((datosIni.valorNominal * resultados.tasaEfectivaMensual) * (datosIni.impuestoRenta/100)),
            flujoBonista: (-1) * (((datosIni.valorNominal * resultados.tasaEfectivaMensual) + ((parseFloat(datosIni.valorNominal) + filaObj[0].amortizacion) * (1+0))/(Math.floor(resultados.numTotalPeriodos) - j + 1)) + 0),
            flujoAct: ((-1) * (((datosIni.valorNominal * resultados.tasaEfectivaMensual) + ((parseFloat(datosIni.valorNominal) + filaObj[0].amortizacion) * (1+0))/(Math.floor(resultados.numTotalPeriodos) - j + 1)) + 0))/(Math.pow((1+resultados.cokMensual),j)),
            FAPlazo: (((-1) * (((datosIni.valorNominal * resultados.tasaEfectivaMensual) + ((parseFloat(datosIni.valorNominal) + filaObj[0].amortizacion) * (1+0))/(Math.floor(resultados.numTotalPeriodos) - j + 1)) + 0))/(Math.pow((1+resultados.cokMensual),j))) * j *(resultados.frecuenciaCupon/datosIni.diasAno),
            factorConversidad: (((-1) * (((datosIni.valorNominal * resultados.tasaEfectivaMensual) + ((parseFloat(datosIni.valorNominal) + filaObj[0].amortizacion) * (1+0))/(Math.floor(resultados.numTotalPeriodos) - j + 1)) + 0))/(Math.pow((1+resultados.cokMensual),j))) * j * (1+j)
          }
          filaAnterior = {}
          filaAnterior = {...fila}
          filaObj.push(fila)
        } else if(j > 1 && j < Math.floor(resultados.numTotalPeriodos)) {
          let fila = {
            index: j,
            fechaProgramada:sumaDiasFecha(fechaInicialTabla, resultados.frecuenciaCupon),
            inflacionAnual: 0,
            plazoGracia: "S",
            inflacionSemestral: 0,
            bono: filaAnterior.bono - filaAnterior.amortizacion,
            bonoIndexado: filaAnterior.bonoIndexado - filaAnterior.amortizacion,
            amortizacion: filaAnterior.amortizacion,
            prima: 0,
            cuponInteres: (filaAnterior.bonoIndexado - filaAnterior.amortizacion) * resultados.tasaEfectivaMensual,
            cuota: ((filaAnterior.bonoIndexado - filaAnterior.amortizacion) * resultados.tasaEfectivaMensual) + filaAnterior.amortizacion,
            escudo: ((filaAnterior.bonoIndexado - filaAnterior.amortizacion) * resultados.tasaEfectivaMensual) * (datosIni.impuestoRenta/100),
            flujoEmisor: (((filaAnterior.bonoIndexado - filaAnterior.amortizacion) * resultados.tasaEfectivaMensual) + filaAnterior.amortizacion) + 0,
            flujoEmisorEscudo: ((((filaAnterior.bonoIndexado - filaAnterior.amortizacion) * resultados.tasaEfectivaMensual) + filaAnterior.amortizacion) + 0) - (((filaAnterior.bonoIndexado - filaAnterior.amortizacion) * resultados.tasaEfectivaMensual) * (datosIni.impuestoRenta/100)),
            flujoBonista: (-1) * ((((filaAnterior.bonoIndexado - filaAnterior.amortizacion) * resultados.tasaEfectivaMensual) + filaAnterior.amortizacion) + 0),
            flujoAct: ((-1) * ((((filaAnterior.bonoIndexado - filaAnterior.amortizacion) * resultados.tasaEfectivaMensual) + filaAnterior.amortizacion) + 0))/(Math.pow((1+resultados.cokMensual),j)),
            FAPlazo: (((-1) * ((((filaAnterior.bonoIndexado - filaAnterior.amortizacion) * resultados.tasaEfectivaMensual) + filaAnterior.amortizacion) + 0))/(Math.pow((1+resultados.cokMensual),j))) * j * (resultados.frecuenciaCupon/datosIni.diasAno),
            factorConversidad: (((-1) * ((((filaAnterior.bonoIndexado - filaAnterior.amortizacion) * resultados.tasaEfectivaMensual) + filaAnterior.amortizacion) + 0))/(Math.pow((1+resultados.cokMensual),j))) * j * (1+j)
          }
          filaAnterior = {}
          filaAnterior = {...fila}
          filaObj.push(fila)
        } else {
          let fila = {
            index: j,
            fechaProgramada:sumaDiasFecha(fechaInicialTabla, resultados.frecuenciaCupon),
            inflacionAnual: 0,
            inflacionSemestral: 0,
            plazoGracia: "S",
            bono: filaAnterior.bono - filaAnterior.amortizacion,
            bonoIndexado: filaAnterior.bonoIndexado - filaAnterior.amortizacion,
            amortizacion: filaAnterior.amortizacion,
            prima: (filaAnterior.bonoIndexado - filaAnterior.amortizacion) * (datosIni.prima/100),
            cuponInteres: (filaAnterior.bonoIndexado - filaAnterior.amortizacion) * resultados.tasaEfectivaMensual,
            cuota: ((filaAnterior.bonoIndexado - filaAnterior.amortizacion) * resultados.tasaEfectivaMensual) + filaAnterior.amortizacion,
            escudo: ((filaAnterior.bonoIndexado - filaAnterior.amortizacion) * resultados.tasaEfectivaMensual) * (datosIni.impuestoRenta/100),
            flujoEmisor: (((filaAnterior.bonoIndexado - filaAnterior.amortizacion) * resultados.tasaEfectivaMensual) + filaAnterior.amortizacion) + (filaAnterior.bonoIndexado - filaAnterior.amortizacion) * (datosIni.prima/100),
            flujoEmisorEscudo: ((((filaAnterior.bonoIndexado - filaAnterior.amortizacion) * resultados.tasaEfectivaMensual) + filaAnterior.amortizacion) + (filaAnterior.bonoIndexado - filaAnterior.amortizacion) * (datosIni.prima/100)) - (((filaAnterior.bonoIndexado - filaAnterior.amortizacion) * resultados.tasaEfectivaMensual) * (datosIni.impuestoRenta/100)),
            flujoBonista: (-1) * ((((filaAnterior.bonoIndexado - filaAnterior.amortizacion) * resultados.tasaEfectivaMensual) + filaAnterior.amortizacion) + (filaAnterior.bonoIndexado - filaAnterior.amortizacion) * (datosIni.prima/100)),
            flujoAct: ((-1) * ((((filaAnterior.bonoIndexado - filaAnterior.amortizacion) * resultados.tasaEfectivaMensual) + filaAnterior.amortizacion) + (filaAnterior.bonoIndexado - filaAnterior.amortizacion) * (datosIni.prima/100)))/(Math.pow((1+resultados.cokMensual),j)),
            FAPlazo: (((-1) * ((((filaAnterior.bonoIndexado - filaAnterior.amortizacion) * resultados.tasaEfectivaMensual) + filaAnterior.amortizacion) + (filaAnterior.bonoIndexado - filaAnterior.amortizacion) * (datosIni.prima/100)))/(Math.pow((1+resultados.cokMensual),j))) * j * (resultados.frecuenciaCupon/datosIni.diasAno),
            factorConversidad: (((-1) * ((((filaAnterior.bonoIndexado - filaAnterior.amortizacion) * resultados.tasaEfectivaMensual) + filaAnterior.amortizacion) + (filaAnterior.bonoIndexado - filaAnterior.amortizacion) * (datosIni.prima/100)))/(Math.pow((1+resultados.cokMensual),j))) * j * (1 + j)
          }
          filaAnterior = {};
          filaObj.push(fila);
        }
      }
      for (var i = 0; i < filaObj.length; i++) {
        filaArray.push(
          <ul className="fila flex">
            <li className="itemFila">{filaObj[i].index}</li>
            <li className="itemFila">{filaObj[i].fechaProgramada}</li>
            <li className="itemFila">{filaObj[i].inflacionAnual.toFixed(2)}</li>
            <li className="itemFila">{filaObj[i].inflacionSemestral.toFixed(2)}</li>
            <li className="itemFila">{filaObj[i].plazoGracia}</li>
            <li className="itemFila">{filaObj[i].bono}</li>
            <li className="itemFila">{filaObj[i].bonoIndexado}</li>
            <li className="itemFila">{filaObj[i].amortizacion.toFixed(2) * (-1)}</li>
            <li className="itemFila">{filaObj[i].prima.toFixed(2)}</li>
            <li className="itemFila">{filaObj[i].cuponInteres.toFixed(2) * (-1)}</li>
            <li className="itemFila">{filaObj[i].cuota.toFixed(2) * (-1)}</li>
            <li className="itemFila">{filaObj[i].escudo.toFixed(2)}</li>
            <li className="itemFila">{filaObj[i].flujoEmisor.toFixed(2) * (-1)}</li>
            <li className="itemFila">{filaObj[i].flujoEmisorEscudo.toFixed(2) * (-1)}</li>
            <li className="itemFila">{filaObj[i].flujoBonista.toFixed(2) * (-1)}</li>
            <li className="itemFila">{filaObj[i].flujoAct.toFixed(2) * (-1)}</li>
            <li className="itemFila">{filaObj[i].FAPlazo.toFixed(2) * (-1)}</li>
            <li className="itemFila">{filaObj[i].factorConversidad.toFixed(2) * (-1)}</li>
          </ul>
        )
      }
      calcularResultadosRatio()
      calcularPrecioActualUtilidad()
      calcularIndicadoresRentabilidad()
    }
    return filaArray
  }

  return (
    <div className="inicio">
      <section className="seccion1 flex" style={{flex:2}}>
        <div className="seccionInput" style={{flex:0.75}}>
          <form className="formularioBono" onSubmit={handleSubmit}>
            <div className="inputs flex" style={{flex:2}}>
              <section className="columnaForm flex" style={{flex:1, flexDirection:"column"}}>
                <div className="inputBox">
                  <h3 className="formLabel">Valor Nominal <span className="fontn s11">(en soles)</span></h3>
                  <input className="formInput" onChange={handleChange} type="numeric" name="valorNominal"/>
                </div>
                <div className="inputBox">
                  <h3 className="formLabel">Valor Comercial <span className="fontn s11">(en soles)</span></h3>
                  <input className="formInput" onChange={handleChange} type="numeric" name="valorComercial"/>
                </div>
                <div className="inputBox">
                  <h3 className="formLabel">Número de Años</h3>
                  <input className="formInput" onChange={handleChange} type="numeric" name="numeroAnos"/>
                </div>
                <div className="inputBox">
                  <h3 className="formLabel">Fecha de Emisión <span className="fontn s11">(día/mes/ano)</span></h3>
                  <input className="formInput" onChange={handleChange} type="date" name="fechaEmision"/>
                </div>
                <div className="inputBox">
                  <h3 className="formLabel">Frecuencia del Cupón</h3>
                  <select id="freCupon" onChange={handleChange} name="freCupon">
                    <option value="mensual">Mensual</option>
                    <option value="bimestral">Bimestral</option>
                    <option value="trimestral">Trimestral</option>
                    <option value="cuatrimestral">Cuatrimestral</option>
                    <option value="semestral">Semestral</option>
                    <option value="anual">Anual</option>
                  </select>
                </div>
                <div className="inputBox">
                  <h3 className="formLabel">Dias por Año</h3>
                  <select id="diasAno" onChange={handleChange} name="diasAno">
                    <option value="365">365</option>
                    <option value="360">360</option>
                  </select>
                </div>
                <div className="inputBox">
                  <h3 className="formLabel">Tipo de Tasa de Interés</h3>
                  <select id="tipoTasa" onChange={handleChange} name="tipoTasa">
                    <option value="nominal">Nominal</option>
                    <option value="efectiva">Efectiva</option>
                  </select>
                </div>
                <div className="inputBox">
                  <h3 className="formLabel">Días Capitalización</h3>
                  <select id="capitalizacion" onChange={handleChange} name="capitalizacion">
                    <option value="diaria">Diaria</option>
                    <option value="quincenal">Quincenal</option>
                    <option value="mensual">Mensual</option>
                    <option value="bimestral">Bimestral</option>
                    <option value="trimestral">Trimestral</option>
                    <option value="cuatrimestral">Cuatrimestral</option>
                    <option value="semestral">Semestral</option>
                    <option value="anual">Anual</option>
                  </select>
                </div>
              </section>
              <section className="columnaForm flex" style={{flex:1, flexDirection:"column"}}>
                <div className="inputBox">
                  <h3 className="formLabel">Tasa de Interés <span className="fontn s11">(%)</span></h3>
                  <input className="formInput" onChange={handleChange} type="numeric" name="tasaInteres"/>
                </div>
                <div className="inputBox">
                  <h3 className="formLabel">Tasa Anual de Descuento <span className="fontn s11">(%)</span></h3>
                  <input className="formInput" onChange={handleChange} type="numeric" name="tasaDescuento"/>
                </div>
                <div className="inputBox">
                  <h3 className="formLabel">Impuesto a la Renta <span className="fontn s11">(%)</span></h3>
                  <input className="formInput" onChange={handleChange} type="numeric" name="impuestoRenta"/>
                </div>
                <div className="inputBox">
                  <h3 className="formLabel">Prima <span className="fontn s11">(%)</span></h3>
                  <input className="formInput" onChange={handleChange} type="numeric" name="prima"/>
                </div>
                <div className="inputBox">
                  <h3 className="formLabel">Estructuración <span className="fontn s11">(%)</span></h3>
                  <input className="formInput" onChange={handleChange} type="numeric" name="estructuracion"/>
                </div>
                <div className="inputBox">
                  <h3 className="formLabel">Colocación <span className="fontn s11">(%)</span></h3>
                  <input className="formInput" onChange={handleChange} type="numeric" name="colocacion"/>
                </div>
                <div className="inputBox">
                  <h3 className="formLabel">Flotación <span className="fontn s11">(%)</span></h3>
                  <input className="formInput" onChange={handleChange} type="numeric" name="flotacion"/>
                </div>
                <div className="inputBox">
                  <h3 className="formLabel">CAVALI <span className="fontn s11">(%)</span></h3>
                  <input className="formInput" onChange={handleChange} type="numeric" name="cavali"/>
                </div>
              </section>
            </div>
            <div className="controlBotones flex">
              <button className={"botonTipoBono" + (bonoActivo === "BonoAmericano" ? " bonoActivo" : " ")} type="button" onClick={handleTipoBono} name="BonoAmericano">Bono Americano</button>
              <button className={"botonTipoBono" + (bonoActivo === "BonoAleman" ? " bonoActivo" : " ")} type="button" onClick={handleTipoBono} name="BonoAleman">Bono Aleman</button>
              <button className={"botonTipoBono" + (bonoActivo === "BonoFrances" ? " bonoActivo" : " ")} type="button" onClick={handleTipoBono} name="BonoFrances">Bono Frances</button>
              <button className="botonSubmit" type="submit">Submit</button>
            </div>
          </form>
        </div>
        <div className="seccionOutput flex" style={{flex:1.25}}>
          <div className="seccion1">
            <div className="tablaOutput flex" style={{height:"30.85rem"}}>
              <ul className="listaOutput flex" style={{flexDirection:"column", flex: 10}}>
              <h2 className="titulo" style={{flex:1}}>Estructuración del Bono</h2>
                <li className="itemListaOutput" style={{flex:1}}>
                  <h3>Frecuencia de Cupón: <span className="fontb">{resultados.frecuenciaCupon}</span></h3>
                </li>
                <li className="itemListaOutput" style={{flex:1}}>
                  <h3>Días Capitalización: <span className="fontb">{resultados.diasCapitalizacion}</span></h3>
                </li>
                <li className="itemListaOutput" style={{flex:1}}>
                  <h3>Número de periodos por año: <span className="fontb">{resultados.numPeriodosAno && resultados.numPeriodosAno.toFixed(2)}</span></h3>
                </li>
                <li className="itemListaOutput" style={{flex:1}}>
                  <h3>Número total de periodos: <span className="fontb">{resultados.numTotalPeriodos && resultados.numTotalPeriodos.toFixed(2)}</span></h3>
                </li>
                <li className="itemListaOutput" style={{flex:1}}>
                  <h3>Tasa efectiva anual: <span className="fontb">{resultados.tasaEfectivaAnual && resultados.tasaEfectivaAnual.toFixed(2)}</span></h3>
                </li>
                <li className="itemListaOutput" style={{flex:1}}>
                  <h3>Tasa efectiva por periodo: <span className="fontb">{resultados.tasaEfectivaMensual && resultados.tasaEfectivaMensual.toFixed(2)}</span></h3>
                </li>
                <li className="itemListaOutput" style={{flex:1}}>
                  <h3>COK {datosIni.freCupon}: <span className="fontb">{resultados.cokMensual && resultados.cokMensual.toFixed(2)}</span></h3>
                </li>
                <li className="itemListaOutput" style={{flex:1}}>
                  <h3>Costes Iniciales Emisor: <span className="fontb">{resultados.costesIniEmisor && resultados.costesIniEmisor.toFixed(2)}</span></h3>
                </li>
                <li className="itemListaOutput" style={{flex:1}}>
                  <h3>Costes Iniciales Bonista: <span className="fontb">{resultados.costesIniBonista && resultados.costesIniBonista.toFixed(2)}</span></h3>
                </li>
              </ul>
            </div>
          </div>
          <div className="seccion2" style={{flexDirection:"column", flex:3}}>
            <div className="tablaOutput flex" style={{flex:1}}>
              <ul className="listaOutput">
              <h2 className="titulo">Precio Actual y Utilidad</h2>
                <li className="itemListaOutput">
                  <h3>Precio Actual: <span className="fontb">{resultadosPA.precioActual.toFixed(2)}</span></h3>
                </li>
                <li className="itemListaOutput">
                  <h3>Utilidad / Perdida: <span className="fontb">{resultadosPA.utilidadPerdida.toFixed(2)}</span></h3>
                </li>
              </ul>
            </div>
            <div className="tablaOutput flex" style={{flex:1}}>
              <ul className="listaOutput">
                <h2 className="titulo">Ratios de Decision</h2>
                <li className="itemListaOutput">
                  <h3>Duracion: <span className="fontb">{resultadosRatio.duracion.toFixed(2)}</span></h3>
                </li>
                <li className="itemListaOutput">
                  <h3>Convexidad: <span className="fontb">{resultadosRatio.convexidad.toFixed(2)}</span></h3>
                </li>
                <li className="itemListaOutput">
                  <h3>Total: <span className="fontb">{resultadosRatio.total.toFixed(2)}</span></h3>
                </li>
                <li className="itemListaOutput">
                  <h3>Duracion Modificada: <span className="fontb">{resultadosRatio.duracionModificada.toFixed(2)}</span></h3>
                </li>
              </ul>
            </div>
            <div className="tablaOutput flex" style={{flex:1}}>

              <ul className="listaOutput">
              <h2 className="titulo">Indicadores Rentabilidad</h2>
                <li className="itemListaOutput">
                  <h3>TCEA Emisor: <span className="fontb">{(resultadosIR.tceaEmisor*100).toFixed(2) + "%"}</span></h3>
                </li>
                <li className="itemListaOutput">
                  <h3>TCEA Emisor c/ Escudo : <span className="fontb">{(resultadosIR.tceaEmisorEscudo*100).toFixed(2) + "%"}</span></h3>
                </li>
                <li className="itemListaOutput">
                  <h3>TREA Bonista: <span className="fontb">{(resultadosIR.treaBonista*100).toFixed(2) + "%"}</span></h3>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>
      <section className="seccion2">
        <div className="tablaResultados">
          <h3 className="titulotabla">Tabla Resultados</h3>
            {
              nuevaTabla === true &&
              <div className="filaTitulos flex">
                <h4 className="titulo">Index</h4>
                <h4 className="titulo">Fecha P.</h4>
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
               bonoActivo === "BonoAmericano" && nuevaTabla === true ? bonoAmericano() :
               bonoActivo === "BonoFrances" && nuevaTabla === true ? bonoFrances() :
               bonoActivo === "BonoAleman" && nuevaTabla === true ? bonoAleman() :
               <div>INRESA LOS PARAMETROS PARA CREAR UNA TABLA</div>
            }
            {
               nuevaTabla === true &&
               <div className="botonesTabla flex">
                 <button className="botonSaveTabla" onClick={handleSaveTabla}>Guardar tabla</button>
                 <button className="botonBorrarTabla" onClick={handleBorrarNuevaTabla}>Borrar tabla</button>
               </div>
            }

        </div>
      </section>
    </div>
  )
}

export default Homepage;
