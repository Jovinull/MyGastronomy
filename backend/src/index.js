// Importa módulos necessários
import express from 'express' // Framework para criar e gerenciar servidores HTTP
import cors from 'cors' // Middleware para habilitar o CORS (Cross-Origin Resource Sharing)
import { Mongo } from './database/mongo.js' // Importa o gerenciador de conexão com o MongoDB
import { config } from 'dotenv' // Biblioteca para carregar variáveis de ambiente de um arquivo `.env`
import authRouter from './auth/auth.js' // Importa o roteador de autenticação

// Carrega as variáveis de ambiente do arquivo `.env` para `process.env`
config()

// Função principal que inicia o servidor
async function main() {
  // Define o hostname e a porta para o servidor
  const hostname = 'localhost' // Endereço onde o servidor será executado
  const port = 3000 // Porta em que o servidor escutará

  // Cria uma nova aplicação Express
  const app = express()
  
  // Conecta ao banco de dados MongoDB utilizando as variáveis de ambiente
  const mongoConnection = await Mongo.connect({ 
    mongoConnectionString: process.env.MONGO_CS, // String de conexão (URI) definida no arquivo `.env`
    mongoDbName: process.env.MONGO_DB_NAME // Nome do banco de dados
  })

  // Exibe no console o resultado da tentativa de conexão com o banco
  console.log(mongoConnection)

  // Configura o middleware para interpretar requisições com corpo no formato JSON
  app.use(express.json())

  // Habilita o CORS para permitir requisições de diferentes origens
  app.use(cors())

  // Define uma rota básica para o endpoint raiz (`/`)
  app.get('/', (req, res) => {
    res.send({
      success: true, // Indica que a requisição foi bem-sucedida
      statusCode: 200, // Código de status HTTP
      body: 'Welcome to MyGastronomy' // Mensagem de boas-vindas
    })
  })

  // Configura o roteador de autenticação para rotas que começam com `/auth`
  app.use('/auth', authRouter)

  // Inicia o servidor na porta especificada e exibe uma mensagem no console
  app.listen(port, () => {
    console.log(`Server running on: http://${hostname}:${port}`)
  })
}

// Chama a função principal para iniciar a aplicação
main()
