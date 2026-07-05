let pedidoActual = null;

document
.getElementById("interpretar")
.addEventListener("click",()=>{

    const texto=document.getElementById("mensaje").value;

    if(texto.trim()===""){
        alert("Pegá un mensaje.");
        return;
    }

    pedidoActual=interpretarPedido(texto);

    mostrarComanda(pedidoActual);

});

document
.getElementById("registrar")
.addEventListener("click",async()=>{

    if(!pedidoActual){
        alert("Primero interpretá un pedido.");
        return;
    }

    Storage.guardar(pedidoActual);

    actualizarHistorial();

    const enviado = await Sync.enviar(pedidoActual);

    if(enviado){

        console.log("Pedido sincronizado.");

    }else{

        console.log("Quedó pendiente de sincronización.");

    }

    pedidoActual=null;

    document.getElementById("mensaje").value="";

});