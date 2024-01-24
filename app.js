const express = require('express');
const app = express();
const https = require('https');
const mongoose = require('mongoose');
const _ = require('lodash');

app.set('view engine', 'ejs');
app.use(express.static(__dirname + "/resources"));
app.engine('html', require('ejs').renderFile);

mongoose.connect('mongodb://localhost:27017/cryptoDB');

const cryptoSchema = mongoose.Schema({
    key: String,
    base_unit: String,
    quote_unit: String,
    low: Number,
    high: Number,
    last: Number,
    type: String,
    open: Number,
    volume: Number,
    sell: Number,
    buy: Number,
    name: String,
    at: Number
});

const cryptoModel = mongoose.model('crypto', cryptoSchema);

app.get('/', async (req, res)=>{
    const url = 'https://api.wazirx.com/api/v2/tickers';

    https.get(url, (resp)=>{
        let rawData = "";
        resp.on('data', (chunk)=>{
            rawData += chunk;
        });
        resp.on('end', async ()=>{
            const jsonData = JSON.parse(rawData);
            for(const key in jsonData)
            {
                const query = await cryptoModel.findOne({key:key});
                if(query === null)
                {
                    const data = new cryptoModel({
                        key: key,
                        base_unit: jsonData[key].base_unit,
                        quote_unit: jsonData[key].quote_unit,
                        low: jsonData[key].low,
                        high: jsonData[key].high,
                        last: (jsonData[key].last).toFixed(8),
                        type: jsonData[key].type,
                        open: jsonData[key].open,
                        volume: jsonData[key].volume,
                        sell: jsonData[key].sell,
                        buy: jsonData[key].buy,
                        name: jsonData[key].name,
                        at: jsonData[key].at
                    });
                    data.save();
                } else {
                    cryptoModel.findOneAndUpdate(
                    {key: key}, 
                    {
                        $set: 
                        {
                            base_unit: jsonData[key].base_unit,
                            quote_unit: jsonData[key].quote_unit,
                            low: jsonData[key].low,
                            high: jsonData[key].high,
                            last: jsonData[key].last,
                            type: jsonData[key].type,
                            open: jsonData[key].open,
                            volume: jsonData[key].volume,
                            sell: jsonData[key].sell,
                            buy: jsonData[key].buy,
                            name: jsonData[key].name,
                            at: jsonData[key].at
                        }
                    }).then(()=>{
                        // console.log(`${key} updated successfully`);
                    });
                }
            }
        });
    });

    const arr = await cryptoModel.find({}).limit(10);
    res.render('index', {
        name: null,
        arr: arr,
        dropName: "ALL"
    });
});

app.get('/:crypto_unit', async (req, res)=>{
    const data = await cryptoModel.find({base_unit: req.params.crypto_unit});
    const name = _.upperCase(req.params.crypto_unit);
    res.render('index', {
        arr: data,
        name: name + "/INR",
        dropName: name
    });
});

app.listen(3000, ()=>{
    console.log("Server up and running");
});