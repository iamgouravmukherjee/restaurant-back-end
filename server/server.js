const http = require('http');
const mongoose = require('mongoose');
const express = require('express');
const bodyParser = require('body-parser');
// const fs = require('fs');
const cors = require('cors');

//mongoose promise use global promise
mongoose.Promise = global.Promise;

// express setup
const port = process.env.PORT || 3000;
const app = express()

app.use(cors({
    "origin": "https://he-backend.herokuapp.com",
    "methods": "GET,HEAD,PUT,PATCH,POST,DELETE",
    "preflightContinue": false,
    "optionsSuccessStatus": 204

}))
//middleware
app.use(bodyParser.json({limit:'10mb'}))

//MongoDB setup
mongoose.connect('mongodb://mytest:skyhigh9@ds133632.mlab.com:33632/my_he',{ useNewUrlParser: true });


const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function () {
    console.log('we are connected!')
});



//Schema 
let topRestoSchema = new mongoose.Schema({
    "RestaurantID": Number,
    "RestaurantName": String,
    "Cuisines": Array,
    "AverageCostfortwo": Number,
    "Currency": String,
    "HasTablebooking": String,
    "HasOnlinedelivery": String,
    "AggregateRating": Number,
    "RatingColor": String,
    "RatingText": String,
    "Votes": Number
});

//Model
let TopResto = mongoose.model('TopResto', topRestoSchema);

app.get('/',(req, res)=>{
    res.send('hello world');
})

app.get('/resto-details/:id', (req, res) => {
    TopResto.find({ _id: req.params.id })
        .then(doc => {
            res.send(doc);
        })
        .catch(e => {
            res.send(e);
        })
});

app.get('/top-resto', (req, res) => {

    let limit = 10;
    let skip = 0;
    let page = 1;

    TopResto.count()
        .then(count => {
            return TopResto.find({}, null, {sort:{AggregateRating:-1}, skip: skip, limit: limit })
                .then(docs => {
                    res.send({ data: docs, page: page, skip: skip, count: count });
                })
        })
        .catch(e => {
            res.send(e)
        })
});

app.get('/top-resto/:page', (req, res) => {

    const paramsPage = parseInt(req.params.page);

    let page = paramsPage > 0 ? paramsPage - 1 : 0;
    let limit = 10;
    let skip = limit * page;

    TopResto.countDocuments()
        .then(count => {
            if (skip >= count) {
                return res.status(404).send('No more data to show')
            }

            return TopResto.find({}, null, {sort:{AggregateRating:-1}, skip: skip, limit: limit })
                .then(docs => {

                    res.send({ data: docs, page: paramsPage, skip: skip, count: count });

                })
        })
        .catch(e => {
            res.send(e)
        })
});


app.get('/search/:q', (req, res) => {

    let searchQuery = req.params.q;

    let limit = 10;
    let skip = 0;
    let page = 1;

    // TopResto.update({
    //     RestaurantName: { $regex: searchQuery, $options: 'i' }
    // },
    //     {
    //         $inc: {
    //             searched: 1
    //         }
    //     },
    //     {
    //         multi: true
    //     }
    // );

    (async () => {
        const count = await TopResto.find({ RestaurantName: { $regex: searchQuery, $options: 'i' } })
            .count();
        TopResto.find({ RestaurantName: { $regex: searchQuery, $options: 'i' } }, null, { skip: skip, limit: limit })
        .then(docs => {
            res.send({ data: docs, page: page, skip: skip, count: count })

        })
        .catch(e => {
            res.send(e);
        })
    })();

       
})

app.get('/search/:q/:p', (req, res) => {

    let paramsP = parseInt(req.params.p);
    let searchQuery = req.params.q;
    let page = paramsP > 0 ? paramsP - 1 : 0;
    let limit = 10;
    let skip = limit * page;

    TopResto.find({ RestaurantName: { $regex: searchQuery, $options: 'i' } })
        .count()
        .then(count => {
            if (skip >= count) {
                return res.status(404).send('No more data to show')
            }
            return TopResto.find({ RestaurantName: { $regex: searchQuery, $options: 'i' } }, null, { skip: skip, limit: limit })
                .then(docs => {
                    res.send({ data: docs, page: paramsP, skip: skip, count: count })
                })
        })
        .catch(e => {
            res.send(e);
        })
})



app.post('/cuisines', (req ,res)=>{
    let data = req.body;
    let cuisines = data.cuisines;
    TopResto.find({Cuisines: {$in: cuisines}})
    .then(docs=>{
        res.send({docs,  count :docs.length});
    })
    .catch(e=>{
        res.send(e);
    })
})

app.post('/sort-by', (req ,res)=>{
    let data = req.body;
    let sort_by = data.sort_by;
    let value = data.value;
    // AggregateRating, Votes and Average cost for two

    // sort_by is a key and value would be 1 -1
    let sortObj = {};
    sortObj[sort_by] = value;

    console.log('sort data',sortObj);

    TopResto.find({}, null, {sort: sortObj})
    .then(docs=>{
        return res.send(docs);
    })
    .catch(e=>{
        return res.send(e);
    })
})



// app.post('/seed_data', (req, res)=>{
//     let data = req.body;
//     let myArray = [];
//     let myErrors = [];
//     console.log(data[0].Cuisines);
//     for(let i=0; i < data.length; i++){
//         data[i].Cuisines = data[i].Cuisines.split(",").map(word => word.trim());
//         let topResto = new TopResto(data[i]);
//         topResto.save()
//         .then((doc) =>{
//             myArray.push(doc)
//         })
//         .catch(e=>{
//             myErrors.push(e)
//         })
//     }
//     res.status(200).send(myArray,myErrors);
// })



// app port 
const server = http.createServer(app);

server.listen(port, () => {
    console.log(`Server running at ${port}/`);
});