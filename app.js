const express = require("express");
const bodyParser = require("body-parser");
const mongoose=require("mongoose");
const _ = require("lodash");
const app=express();

app.set('view engine','ejs');

let workitems=[];
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect("mongodb://localhost:27017/todolistDB",{useNewUrlParser:true});

const itemschema={
    name: String
};

const Item=mongoose.model("Item",itemschema);

const item1=new Item({
    name: "Welcome to your Todolist!"
});
const item2=new Item({
    name: "Hit the + button to add a new item to your list."
});
const item3=new Item({
    name: "<--Hit this to delete an item."
});
const defaultitems=[item1,item2,item3];

const listschema={
    name: String,
    items: [itemschema]
};

const List=mongoose.model("List",listschema);


app.get("/",function(req,res){
    Item.find({},function(err,founditems){
        if(founditems.length===0){
            Item.insertMany(defaultitems,function(err){
                if(err)console.log(err);
                else console.log("Successfully saved default items to DB!!!");
            });
            res.redirect("/");
        }
        else res.render("list",{ listtitle: "Today",newitems: founditems});
    });    
});

app.get("/:customListName",function(req,res){
    const customListName= _.capitalize(req.params.customListName);

    List.findOne({name: customListName},function(err,foundList){
        if(!err){
            if(!foundList){
                //create new list
                const list=new List({
                    name: customListName,
                    items: defaultitems
                });
                list.save();
                res.redirect("/"+customListName);
            }
            else{
                //show an existing list
                res.render("list",{listtitle : foundList.name,newitems: foundList.items});
            }
        }
    });

    

});


app.post("/",function(req,res){
    const itemname=req.body.newitem;
    const listname=req.body.list;
    const item=new Item({
        name: itemname
    });
    
    if(listname==="Today"){
        item.save();
        res.redirect("/");
    }else{
        List.findOne({name: listname},function(err,foundList){
            foundList.items.push(item);
            foundList.save();
            res.redirect("/"+listname);
        });
    }

});

app.post("/delete",function(req,res){
    const checkedItemId=req.body.checkbox;
    const listname= req.body.listname;

    if(listname==="Today"){
        Item.findByIdAndRemove(checkedItemId,function(err){
            if(!err){
                console.log("Successfully deleted checked item");
                res.redirect("/");
            }
        });
    } else {
        List.findOneAndUpdate({name:listname},{$pull:{items:{_id:checkedItemId}}},function(err,foundList){
            if(!err){
                res.redirect("/"+listname);
            }
        });
    }
});

app.get("/work",function(req,res){
    res.render("list",{listtitle: "Work List",newitems: workitems});
});

app.post("/work",function(req,res){
    res.render("list");
});

app.listen(3000,function(){
    console.log("Server started at port 3000");
});