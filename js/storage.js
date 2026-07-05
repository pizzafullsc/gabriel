const Storage={

guardar(pedido){

let pedidos=this.obtener();

pedido.id=Date.now();

pedido.fecha=new Date().toLocaleString("es-UY");

pedidos.unshift(pedido);

localStorage.setItem("gabriel_pedidos",JSON.stringify(pedidos));

},

obtener(){

return JSON.parse(localStorage.getItem("gabriel_pedidos")) || [];

}

};