// Importa módulos necessários para o projeto
import express from 'express' // Framework para criar rotas HTTP
import passport from 'passport' // Biblioteca de autenticação
import LocalStrategy from 'passport-local' // Estratégia de autenticação local
import crypto from 'crypto' // Módulo para criptografia de senhas e geração de sal
import { Mongo } from '../database/mongo.js' // Importa configuração de banco de dados MongoDB
import jwt from 'jsonwebtoken' // Biblioteca para criação de tokens JWT
import { ObjectId } from 'mongodb' // Permite manipular IDs do MongoDB
import { error } from 'console' // Opcional: para registrar erros no console

// Nome da coleção no MongoDB onde os dados dos usuários serão armazenados
const collectionName = 'users'

// Configura a estratégia de autenticação local usando o Passport
passport.use(
  new LocalStrategy(
    { usernameField: 'email' }, // Define que o campo "email" será usado como nome de usuário
    async (email, password, callback) => {
      // Busca o usuário no banco de dados pelo e-mail fornecido
      const user = await Mongo.db.collection(collectionName).findOne({ email: email })

      if (!user) {
        // Retorna falso se o usuário não for encontrado
        return callback(null, false)
      }

      // Obtém o salt armazenado no banco de dados para o usuário
      const saltBuffer = user.salt.buffer

      // Recalcula a senha usando o mesmo salt e algoritmo para comparação
      crypto.pbkdf2(password, saltBuffer, 310000, 16, 'sha256', (err, hashedPassword) => {
        if (err) {
          // Se ocorrer um erro no processo de hash, retorna falso
          return callback(null, false)
        }

        // Compara a senha armazenada no banco com a senha gerada
        const userPasswordBuffer = Buffer.from(user.password.buffer)

        if (!crypto.timingSafeEqual(userPasswordBuffer, hashedPassword)) {
          // Senha não confere, retorna falso
          return callback(null, false)
        }

        // Remove informações sensíveis (senha e salt) antes de retornar o usuário
        const { password, salt, ...rest } = user

        // Passa os dados do usuário (sem senha e salt) para o próximo middleware
        return callback(null, rest)
      })
    }
  )
)

// Cria um roteador para autenticação
const authRouter = express.Router()

// Rota para cadastro de novos usuários
authRouter.post('/signup', async (req, res) => {
  // Verifica se já existe um usuário com o e-mail fornecido
  const checkUser = await Mongo.db.collection(collectionName).findOne({ email: req.body.email })

  if (checkUser) {
    // Retorna erro caso o e-mail já esteja em uso
    return res.status(500).send({
      success: false,
      statusCode: 500,
      body: {
        text: 'User already exists'
      }
    })
  }

  // Gera um salt aleatório para o novo usuário
  const salt = crypto.randomBytes(16)

  // Criptografa a senha do usuário usando o salt
  crypto.pbkdf2(req.body.password, salt, 310000, 16, 'sha256', async (err, hashedPassword) => {
    if (err) {
      // Retorna erro caso algo dê errado durante a criptografia
      return res.status(500).send({
        success: false,
        statusCode: 500,
        body: {
          text: 'Error on crypto password!',
          err: err,
        }
      })
    }

    // Insere o novo usuário no banco de dados
    const result = await Mongo.db.collection(collectionName).insertOne({
      email: req.body.email,
      password: hashedPassword,
      salt,
    })

    if (result.insertedId) {
      // Busca o usuário recém-criado no banco
      const user = await Mongo.db.collection(collectionName).findOne({ _id: new ObjectId(result.insertedId) })

      // Gera um token JWT para autenticação
      const token = jwt.sign(user, 'secret ')

      // Retorna sucesso e os dados do usuário junto com o token
      return res.status(500).send({
        success: true,
        statusCode: 200,
        body: {
          text: 'User registered correctly!',
          token,
          user,
          logged: true,
        }
      })
    }
  })
})

// Define a rota POST para "/login" dentro do authRouter
authRouter.post('/login', (req, res) => {
    // Utiliza o Passport para autenticar o usuário com a estratégia 'local'
    passport.authenticate('local', (error, user) => {
        // Se ocorrer um erro no processo de autenticação, retorna uma resposta com erro
        if (error) {
            return res.status(500).send({
                success: false, // Indica falha na autenticação
                statusCode: 500, // Código de status HTTP de erro interno
                body: {
                    text: 'Error during authentication', // Mensagem de erro
                    error // Informação do erro para depuração
                }
            });
        }

        // Se o usuário não for encontrado, retorna uma resposta informando o problema
        if (!user) {
            return res.status(400).send({
                success: false, // Indica que a autenticação falhou
                statusCode: 400, // Código de status HTTP de erro de cliente
                body: {
                    text: 'Credentials are not correct', // Mensagem indicando que o usuário não foi encontrado
                }
            });
        }

        // Se a autenticação for bem-sucedida, gera um token JWT para o usuário
        const token = jwt.sign(user, 'secret'); // 'secret' é a chave de assinatura do token
        return res.status(200).send({
            success: true, // Indica que a autenticação foi bem-sucedida
            statusCode: 200, // Código de status HTTP de sucesso
            body: {
                text: 'User logged in correctly', // Mensagem de sucesso
                user, // Dados do usuário autenticado (exceto senha/salt)
                token // Token gerado para autenticação futura
            }
        });
    })(req, res); // Executa o middleware de autenticação passando os objetos de requisição e resposta
});

// Exporta o roteador para ser usado em outros arquivos
export default authRouter
