const bodyParser = require("body-parser");
const express = require("express");
const date = require(__dirname + "/date.js");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

mongoose.connect(
  "mongodb+srv://admin-norman:panthers32@cluster0.jeuvl.mongodb.net/todolistDB",
  {
    useNewUrlParser: true,
  }
);

const itemsSchema = new mongoose.Schema({
  name: String,
});

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({ name: "Welcome to your todo list!" });
const item2 = new Item({
  name: "Hit the + button to add a new item.",
});
const item3 = new Item({
  name: "<-- Hit this to delete this item.",
});

const defaultItems = [item1, item2, item3];
const listSchema = {
  name: String,
  items: [itemsSchema],
};

const List = mongoose.model("List", listSchema);

app.set("view engine", "ejs");

app.get("/", function (req, res) {
  Item.find({}, function (err, foundItems) {
    if (foundItems.length === 0) {
      Item.insertMany(defaultItems, function (err) {
        if (err) {
          console.log(err);
        } else {
          console.log("Items saved succesfully");
        }
      });
      res.redirect("/");
    } else {
      res.render("list", {
        listTitle: "Today",
        newListOfItems: foundItems,
      });
    }
  });
});

app.post("/", function (req, res) {
  const itemName = req.body.newItem;
  const listName = req.body.plusButton;

  const item = new Item({ name: itemName });

  if (listName === "Today") {
    item.save();
    res.redirect("/");
  } else {
    List.findOne({ name: listName }, function (err, foundList) {
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    });
  }
});

app.post("/delete", function (req, res) {
  const checkedboxId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today") {
    Item.findByIdAndRemove({ _id: checkedboxId }, function (err) {
      if (!err) {
        console.log("Successfully deleted");
        res.redirect("/");
      }
    });
  } else {
    List.findOneAndUpdate(
      { name: listName },
      { $pull: { items: { _id: checkedboxId } } },
      function (err, foundList) {
        if (!err) {
          res.redirect("/" + listName);
        }
      }
    );
  }
});

app.get("/:newListName", function (req, res) {
  const newListName = _.capitalize(req.params.newListName);

  List.findOne({ name: newListName }, function (err, foundList) {
    if (!err) {
      if (!foundList) {
        const list = new List({
          name: newListName,
          items: defaultItems,
        });
        list.save();
        res.redirect("/" + newListName);
      } else {
        res.render("list", {
          listTitle: foundList.name,
          newListOfItems: foundList.items,
        });
      }
    }
  });
});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}
app.listen(port);

app.listen(port, function () {
  console.log("Server Has Started");
});
