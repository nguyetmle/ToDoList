const express = require("express");
const bodyParser = require("body-parser");
const date = require(__dirname + "/date.js");

const app = express();
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public")); //tell express to serve up public folder (and its static resources)

const items = [];

app.get("/", function(req,res){
    const day = date.getDay();
    res.render("list", {kindOfDay: day, newListItems: items});

});

app.post("/", function(req,res){
    const item = req.body.newItem;
    items.push(item);
    res.redirect("/");
})

app.listen(3000,function(){
    console.log("Server started on port 3000");
});