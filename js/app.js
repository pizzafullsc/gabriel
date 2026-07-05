document
.getElementById("interpretar")
.addEventListener("click",()=>{

    const texto=document.getElementById("mensaje").value;

    if(texto.trim()===""){

        alert("Pegá un mensaje.");

        return;

    }

    const pedido=interpretarPedido(texto);

    mostrarComanda(pedido);

    window.pedidoActual=pedido;

});


document
.getElementById("registrar")
.addEventListener("click",()=>{

    if(!window.pedidoActual){

        alert("Primero interpretá un pedido.");

        return;

    }

    Storage.guardar(window.pedidoActual);

    actualizarHistorial();

    alert("Pedido registrado.");

});