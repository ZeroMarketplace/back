// init app and plugins
let express           = require('express');
let path              = require('path');
let cookieParser      = require('cookie-parser');
// let logger       = require('morgan');
const helmet          = require("helmet");
const cors            = require('cors');


let app = express();

// add middlewares
app.use(helmet({crossOriginResourcePolicy: false}));
// app.use(logger('dev'));
app.use(express.json({limit: '5mb'}));
app.use(express.urlencoded({extended: true}));
app.use(cookieParser());
app.use(process.env.STATICS_URL, express.static(path.join(__dirname, 'public')));
app.use(cors());

process.env.TZ = "Asia/Tehran";

// add routes
app.use('/api/users', require('./routes/users'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/brands', require('./routes/brands'));
app.use('/api/units', require('./routes/units'));
app.use('/api/properties', require('./routes/properties'));
app.use('/api/products', require('./routes/products'));
app.use('/api/warehouses', require('./routes/warehouses'));
app.use('/api/accounts', require('./routes/accounts'));

module.exports = app;
