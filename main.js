"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = __importDefault(require("express"));
var path_1 = __importDefault(require("path"));
var app = express_1.default();
app.use(express_1.default.static(path_1.default.join(__dirname, '/')));
app.get('/', function (req, res) {
    res.send('welcome..');
});
var port = process.env.PORT || 9999;
app.listen(port, function () { return "Server is running on port: " + port; });
