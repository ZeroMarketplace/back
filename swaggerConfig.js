import swaggerJsDoc from 'swagger-jsdoc'

const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info   : {
            title      : 'Zero Project API',
            version    : '1.0.0',
            description: 'API documentation for the Zero project',
        },
    },
    apis      : ['./routes/*.js'], // files of routes
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);

export default swaggerDocs;
