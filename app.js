let express = require('express');
const { static } = require('express');


let express_app = express();

express_app.use(express.static('public'));
express_app.set('view engine', 'ejs');

let router = express.Router();

router.get('/', (request, response, next) => {
    response.render('index');
});

express_app.use(router);
express_app.use((request, response, next) => {
    response.render('notFound');
    next();
});

express_app.listen(3000);