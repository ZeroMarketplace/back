// init app and plugins
import express         from 'express';
import path            from 'path';
import cookieParser    from 'cookie-parser';
import helmet          from 'helmet';
import cors            from 'cors';
import {dirname}       from 'node:path';
import {fileURLToPath} from 'node:url';
import swaggerUi       from 'swagger-ui-express';
import swaggerConfig   from "./swaggerConfig.js";

// get __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);


let app = express();

// add middlewares
app.use(helmet({crossOriginResourcePolicy: false}));
// app.use(logger('dev'));
app.use(express.json({limit: '5mb'}));
app.use(express.urlencoded({extended: true}));
app.use(cookieParser());
app.use(process.env.STATICS_URL, express.static(path.join(__dirname, 'public')));
app.use(cors());
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerConfig));

process.env.TZ = "Asia/Tehran";

import usersRouter               from './routes/users.js';
import authRouter                from './routes/auth.js';
import categoriesRouter          from './routes/categories.js';
import brandsRouter              from './routes/brands.js';
import unitsRouter               from './routes/units.js';
import propertiesRouter          from './routes/properties.js';
import productsRouter            from './routes/products.js';
import warehousesRouter          from './routes/warehouses.js';
import accountsRouter            from './routes/accounts.js';
import addAndSubtractRouter      from './routes/add-and-subtract.js';
import accountingDocumentsRouter from './routes/accounting-documents.js';
import purchaseInvoicesRouter    from './routes/purchase-invoices.js';
import settlementsRouter         from './routes/settlements.js';
import settingsRouter            from './routes/settings.js';
import inventoriesRouter         from './routes/inventories.js';
import salesInvoicesRouter       from './routes/sales-invoices.js';
import stockTransfersRouter      from './routes/stock-transfers.js';
import commodityProfitsRouter    from './routes/commodity-profits.js';
import contactsRouter            from './routes/contacts.js';
import conversationsRouter       from './routes/conversations.js';

// add routes
app.use('/api/users', usersRouter);
app.use('/api/auth', authRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/brands', brandsRouter);
app.use('/api/units', unitsRouter);
app.use('/api/properties', propertiesRouter);
app.use('/api/products', productsRouter);
app.use('/api/warehouses', warehousesRouter);
app.use('/api/accounts', accountsRouter);
app.use('/api/add-and-subtract', addAndSubtractRouter);
app.use('/api/accounting-documents', accountingDocumentsRouter);
app.use('/api/purchase-invoices', purchaseInvoicesRouter);
app.use('/api/settlements', settlementsRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/inventories', inventoriesRouter);
app.use('/api/sales-invoices', salesInvoicesRouter);
app.use('/api/stock-transfers', stockTransfersRouter);
app.use('/api/commodity-profits', commodityProfitsRouter);
app.use('/api/contacts', contactsRouter);
app.use('/api/conversations', conversationsRouter);

export default app;
