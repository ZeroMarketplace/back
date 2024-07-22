// init app and plugins
import express from 'express';
import path from 'path';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import cors from 'cors';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

// get __dirname
let __dirname = fileURLToPath(import.meta.url).split('/');
__dirname.splice(__dirname.length - 1, 1);
__dirname = __dirname.join('/');


let app = express();

// add middlewares
app.use(helmet({crossOriginResourcePolicy: false}));
// app.use(logger('dev'));
app.use(express.json({limit: '5mb'}));
app.use(express.urlencoded({extended: true}));
app.use(cookieParser());
// app.use(process.env.STATICS_URL, express.static(__dirname + 'public'));
app.use(cors());

process.env.TZ = "Asia/Tehran";

import usersRouter from './routes/users.js';
import inventoriesRouter from './routes/inventories.js';
import warehousesRouter from './routes/warehouses.js';

// add routes
app.use('/api/users', usersRouter);
// app.use('/api/auth', require('./routes/auth'));
// app.use('/api/categories', require('./routes/categories'));
// app.use('/api/brands', require('./routes/brands'));
// app.use('/api/units', require('./routes/units'));
// app.use('/api/properties', require('./routes/properties'));
// app.use('/api/products', require('./routes/products'));
app.use('/api/warehouses', warehousesRouter);
// app.use('/api/accounts', require('./routes/accounts'));
// app.use('/api/add-and-subtract', require('./routes/add-and-subtract'));
// app.use('/api/purchase-invoices', require('./routes/purchase-invoices'));
// app.use('/api/accounting-documents', require('./routes/accounting-documents'));
// app.use('/api/settlements', require('./routes/settlements'));
// app.use('/api/sales-invoices', require('./routes/sales-invoices'));
app.use('/api/inventories', inventoriesRouter);

export default app;
