document
.getElementById("interpretar")
.addEventListener("click",()=>{

    const mensaje =
        document.getElementById("mensaje").value;

    const datos =
        interpretarPedido(mensaje);

    mostrarComanda(datos);

});