const express = require("express");
const bodyParser = require("body-parser");
const date = require(__dirname + "/date.js");
const mongoose = require("mongoose");

const app = express();
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public")); //tell express to serve up public folder (and its static resources)

mongoose.set("strictQuery",true);
mongoose.connect("mongodb://localhost:27017/todolistDB");
//with mongoose, first create a schema 
const itemSchema = new mongoose.Schema({
    //property of schema
    name: {
        type: String,
        require:[true, "To-do task can't be blank."]
    }
});

const listSchema = new mongoose.Schema({
    name: String,
    items: [itemSchema]
});

//complile schema into a model
const Item = mongoose.model("Item", itemSchema);
const List = mongoose.model("List", listSchema);
//a model is a class with which we construct documents
//in this case, each document will be an item with properties as declared in our schema
// const item1 = new Item({
//     name: "Welcome to your ToDoList"
// });

const defaultItems = []  //an empty list to hold todolist items

Item.insertMany(defaultItems,function(err){
    if (err) {
        console.log(err);
    } else {
        console.log("Successfully saved items to DB");
    }
}); 

app.get("/", function(req,res){
    const day = date.getDay();
    Item.find({}, function(err, foundItem) {
        if (err) {
            console.log(err);
        } else {
            res.render("list", {listTitle: day, newListItems: foundItem});
        }
    })
});

app.post("/", function(req,res){
    const itemName = req.body.newItem;
    const listName = req.body.list;

    const item = new Item({
        name: itemName
    });

    if (listName === date.getDay()) { //if list name is a date
        //show the general todolist of the day
        item.save();
        res.redirect("/");
    } else {
        //create custom todolist (work,chores,etc)
        List.findOne({name: listName}, function(err, foundList) {
            foundList.items.push(item);
            foundList.save();
            res.redirect("/"+listName);
        })
    }

});

// create custom lists using express route parameters
app.get("/:customListName", function(req,res) {
    const customListName = req.params.customListName;

    List.findOne({name:customListName}, function(err,foundList) {
        if (!err) {
            if (!foundList) {
                //create a new list
                const list = new List({
                    name: customListName,
                    items: defaultItems
                });

                list.save();
                res.render("/" + customListName);

            } else {
                //show the existing list
                res.render("list", {listTitle: foundList.name, newListItems: foundList.items})
            }
        }   
    });
});

app.post("/delete",function(req,res){
    const checkedItemId = req.body.checkbox;
    const listName = req.body.listName;

    //check which list is the delete item in 
    if (listName === date.getDay()) {
        Item.findByIdAndRemove(checkedItemId, function(err){
            if (!err) {
                console.log("Successfully deleted checked item");
                res.redirect("/");
            } else {
                console.log(err);
            }
        });
    } else {
        List.findOneAndUpdate({name:listName},  //find the list
                             {$pull: {items: {_id: checkedItemId}}}, //find the item in that list
                             function(err, foundList) {
            if (!err) {
                res.redirect("/"+listName);
            }
        });  
    }
    
})

app.listen(3000,function(){
    console.log("Server started on port 3000");
});