// init app and plugins
let express      = require('express');
let path         = require('path');
let cookieParser = require('cookie-parser');
// let logger       = require('morgan');
const helmet     = require("helmet");
const cors       = require('cors');

// load routes
let usersRouter      = require('./routes/users');
let authRouter       = require('./routes/auth');
let categoriesRouter = require('./routes/categories');

let app = express();

// add middlewares
app.use(helmet({crossOriginResourcePolicy: false}));
// app.use(logger('dev'));
app.use(express.json({limit: '3mb'}));
app.use(express.urlencoded({extended: true}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(cors());

process.env.TZ = "Asia/Tehran";

// add routes
app.use('/api/users', usersRouter);
app.use('/api/auth', authRouter);
app.use('/api/categories', categoriesRouter);

module.exports = app;
