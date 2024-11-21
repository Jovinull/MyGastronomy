// Importa o cliente do MongoDB, que permite conectar-se e interagir com o banco de dados
import { MongoClient } from 'mongodb'

// Exporta um objeto chamado `Mongo` que contém métodos para gerenciar a conexão com o banco de dados
export const Mongo = {
  // Método assíncrono para conectar ao MongoDB
  async connect({ mongoConnectionString, mongoDbName }) {
    try {
      // Cria uma nova instância do cliente MongoDB com a string de conexão fornecida
      const client = new MongoClient(mongoConnectionString)

      // Estabelece a conexão com o MongoDB
      await client.connect()

      // Acessa o banco de dados especificado pelo nome (mongoDbName)
      const db = client.db(mongoDbName)

      // Armazena o cliente e o banco de dados no objeto `Mongo` para reutilização futura
      this.client = client // Referência ao cliente MongoDB conectado
      this.db = db // Referência ao banco de dados selecionado

      // Retorna uma mensagem de sucesso indicando que a conexão foi estabelecida
      return 'Connect to mongo!'

    } catch (error) {
      // Caso ocorra algum erro durante a conexão, retorna uma mensagem de erro e o objeto de erro
      return { text: 'Error during mongo connection', error }
    }
  }
}
