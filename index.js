const http = require('http');
const fs = require('fs');

console.clear();

async function database(callback) {
  try { 
    const buffer = await fs.promises.readFile('./pedidosDelivery.json'); 
    const pedidosDelivery = JSON.parse(buffer.toString());  
    callback(pedidosDelivery) 
  } catch(error) {
    console.error(error)
  };
}

const server = http.createServer((request,response) => {
  const {url, method} = request;

  if(url === '/') {
    response.setHeader('Content-Type','application/json,charset=utf-8')
    if(method === 'GET') {
      return database((pedidosDelivery) => {
        response.end(JSON.stringify(pedidosDelivery))
      })
    }
    else if(method === 'POST') {
      return database((pedidosDelivery) => {
        request.on('data',Pedido => {
          Pedido = JSON.parse(Pedido); 
          Pedido.id = pedidosDelivery.last_id + 1;
          pedidosDelivery.data.push(Pedido);
          pedidosDelivery.last_id = Pedido.id;

          fs.promises.writeFile("./pedidosDelivery.json",JSON.stringify(pedidosDelivery)); 
          response.end(`Pedido realizado, confira: \n ${JSON.stringify(Pedido)}`);
        })
      })
    }
    else if(method === 'PUT') {
      return database((pedidosDelivery) => {
        request.on('data',(pedidoAtualizado) => {
          pedidoAtualizado = JSON.parse(pedidoAtualizado);
          const idPedidoAtualizado = pedidoAtualizado.id;
          const idxPedidoProcurado = pedidosDelivery.data.findIndex((pedido) => {
            return pedido.id === idPedidoAtualizado
          });
          const pedidoAntigo = JSON.stringify(pedidosDelivery.data[idxPedidoProcurado]); 
          pedidosDelivery.data[idxPedidoProcurado].Restaurante = pedidoAtualizado.Restaurante;
          pedidosDelivery.data[idxPedidoProcurado].Principal = pedidoAtualizado.Principal;
          pedidosDelivery.data[idxPedidoProcurado].Acompanhamento = pedidoAtualizado.Acompanhamento;
          pedidosDelivery.data[idxPedidoProcurado].Bebida = pedidoAtualizado.Bebida;
          pedidosDelivery.data[idxPedidoProcurado].Localidade = pedidoAtualizado.Localidade;
  
          fs.promises.writeFile('./pedidosDelivery.json',JSON.stringify(pedidosDelivery));

          response.end(`Pedido atualizado. 
          \n Pedido antigo: 
          \n ${pedidoAntigo} 
          \n Pedido atualizado: 
          \n ${JSON.stringify(pedidosDelivery.data[idxPedidoProcurado])}`)
        })
      })
    }
    else if(method === 'DELETE') {
      return database((pedidosDelivery) => {
        request.on('data',(pedidoDeletado) => {
          pedidoDeletado = JSON.parse(pedidoDeletado)
          const idPedidoDeletado = pedidoDeletado.id;
          const idxPedidoProcurado = pedidosDelivery.data.findIndex((pedido) => {
            return pedido.id === idPedidoDeletado; 
          });
          console.log(idxPedidoProcurado)
          if(idxPedidoProcurado != -1) {
            if(idxPedidoProcurado === pedidosDelivery.data.length-1) {
              pedidosDelivery.last_id = pedidosDelivery.data[pedidosDelivery.data.length-2].id
            }
            pedidosDelivery.data.splice(idxPedidoProcurado,1);
            fs.promises.writeFile('./pedidosDelivery.json',JSON.stringify(pedidosDelivery));
            response.end(`Pedido de id ${idPedidoDeletado} deletado.`)
          }
        })
      })
    } else {
      response.writeHead(404);
      response.end('Erro ao realizar a operação.') 
    }
  }
})

server.listen(8000,'localhost',() => {
  const address = server.address();
  console.log(`Servidor rodando ${address.address}:${address.port}`)
})