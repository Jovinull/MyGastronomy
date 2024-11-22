export const ok = (body) => {
    return {
        success: true, // Indica que a requisição foi bem-sucedida
        statusCode: 200, // Código de status HTTP
        body: body
    }
}

export const notFound = () => {
    return {
        success: false, // Indica que a requisição foi bem-sucedida
        statusCode: 400, // Código de status HTTP
        body: 'Not found'
    }
}

export const serverError = (error) => {
    return {
        success: false, // Indica que a requisição foi bem-sucedida
        statusCode: 400, // Código de status HTTP
        body: error
    }
}