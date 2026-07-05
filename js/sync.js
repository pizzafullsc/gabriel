const Sync = {

    api: "https://script.google.com/macros/s/AKfycbzY9JNGyijs5PxTT5mH-EDrxcQwwk4CWkidphYV7tsZI_Xjxrkeoovi1xyDym7EqImsPw/exec",

    async enviar(pedido){

        try{

            const respuesta = await fetch(this.api,{
                method:"POST",
                headers:{
                    "Content-Type":"application/json"
                },
                body:JSON.stringify(pedido)
            });

            if(!respuesta.ok){
                throw new Error("Respuesta HTTP "+respuesta.status);
            }

            return true;

        }catch(error){

            console.error("Error sincronizando:",error);

            return false;

        }

    }

};