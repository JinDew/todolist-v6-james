//jshint esversion:6
 
require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");
const app = express();
const PORT = process.env.PORT || 3000;

 
app.set('view engine', 'ejs');
 
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.set("strictQuery",false);
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB Connected: " + conn.connection.host);
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
}

//Created Schema
const itemsSchema = new mongoose.Schema({
  name: String
});
const listSchema = new mongoose.Schema({
  name: String,
  items: [itemsSchema]
});
 
//Created model
const Item = mongoose.model("Item", itemsSchema);
const List = mongoose.model("List", listSchema);
 
//Creating items
const item1 = new Item({
  name: "Welcome todo list."
});
 
const item2 = new Item({
  name: "Hit + to create new item."
});
 
const item3 = new Item({
  name: "<-- Hit this to delete an item."
});

// Today list
app.get("/", async function(req, res) {
  const foundItems = await Item.find({});
  if (foundItems.length === 0) {
    console.log("nothing in array, so we add 3 default items");
    await Item.insertMany([item1,item2,item3]);
  };
  
  res.render("list", {listTitle: "Today", newListItems: foundItems});
});

// Custom List
app.get("/:customListName", async (req,res)=>{
  const theCustomListName = _.capitalize(req.params.customListName);
  
  try {
    const foundList = await List.findOne({name: theCustomListName});
    
    if(foundList == null) {
      
      //If no list shown, just create one
      const listdefault = new List({
        name: theCustomListName,
        items: [item1,item2,item3]
      });
      await listdefault.save();
      res.redirect("/" + theCustomListName);
    } else { //Found the List, so just display it
      res.render("list", {listTitle:theCustomListName, newListItems:foundList.items});
    }

  } catch (err) {
    console.log(err);
  }

});

app.post("/", async (req,res) => {
  const itemName = req.body.newItem;
  const listName = req.body.list;
  
  const itemEnter = new Item ({
        name:itemName
      });

  if (listName == "Today") { 
    // If "Today" task, then add to items collection
    await itemEnter.save();
    res.redirect("/");
  } else { //If not "Today" task, then push item to the custom list
        const listDoc = await List.findOne({name:listName});
        listDoc.items.push(itemEnter);
        await listDoc.save();
        res.redirect("/" + listName);
    }
  
});

app.post("/delete", async (req,res)=>{
  const idToDel = req.body.CheckToDel;
  const listToDel = req.body.hidCheckbox;

  if (listToDel == "Today") {
  await Item.findByIdAndDelete(idToDel);
  res.redirect("/");
  } else {
      await List.findOneAndUpdate({name:listToDel},{$pull: {items: {_id:idToDel}}});
      res.redirect("/" + listToDel);
    }

});

app.post("/customTask", async (req,res)=>{
  const cusName = req.body.cusName;
  res.redirect("/" + cusName);
});

connectDB().then(()=>{
  app.listen(PORT, function() {
      console.log("Server started and run well");
    });
});
  
