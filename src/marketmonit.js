//config!
const webhook = `https://discordapp.com/api/webhooks/xxxxxxxxxxxxxxxxxx/yyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy`



const axios = require('axios');
const KalmanFilter = require('kalmanjs')
var itemcache = []

//talk to the webhook
function discordmsg(currprice,avprice,reccomend,profit){
    var url = webhook


  axios.post(url, {
    username: "VoxMarket",
    avatar_url: "https://voxiom.io/package/76bd3d4ec9771278bbd6.png",
    content: "",
    embeds: [
        {
            title: "Market Update",
            type: "rich",
            description: "New item listed",
            url: "",
            color: 16747550,
            footer: {
                text: "I am not always 100% accurate, do not trust me over your judgement."
            },
            thumbnail: {
                url: ""
            },
            fields: [
                {
                    name: "Current Price.",
                    value: currprice,
                    inline: true
                },
                {
                    name: "Average Price.",
                    value: avprice,
                    inline: true
                },
                {
                    name: "Estimated Profit.",
                    value: profit,
                    inline: true
                }
                // {
                //     name: "Bot Reccomends?",
                //     value: reccomend,
                //     inline: true
                // }
            ],
            // author: {
            //     name: "asd",
            //     url: "",
            //     icon_url: "https://voxiom.io/package/76bd3d4ec9771278bbd6.png"
            // }
        }
    ]
  })
  .then(function (response) {
    console.log(`done`);
  })
  .catch(function (error) {
    console.log(error);
  });
}

//check if the item is worth buying
function getdeal(item,sellprice){
    axios.post('https://voxiom.io/market/item_info', {
        item_id: item
      })
      .then(function (response) {
        var result = response.data.data.item_info
        //console.log(result)
        if(response.data.success){
            console.log(`Successfully got item's price history`)
            var price = []
            for (var i = result.price_history.length - 1; i >= 0; i--) {
                //console.log(`Time: ${result.price_history[i].time} | Price: ${result.price_history[i].price}`)
                price.push(result.price_history[i].price)
            }

            function getAvg(price) {
                var kf = new KalmanFilter();
                var avarageprice = []
                for(i = price.length, i == 0; i--;){
                    avarageprice.push(kf.filter(price[i]))
                }
                const total = avarageprice.reduce((acc, c) => acc + c, 0);
                return total / avarageprice.length;
            }

            const average = Math.floor(getAvg(price));
            console.log(`Avarage price for item: ${average} Current price ${sellprice}`);
            if(average <= sellprice - Math.floor(sellprice/10)){
                console.log(`Bad buy\n`)
            }else{
                if(average - sellprice - Math.floor(sellprice/10) >= 30){
                    if(!itemcache.includes(item)){
                        itemcache.push(item)
                        console.log(`Good buy\n`)
                        discordmsg(sellprice,average,`Buy this item`,average - sellprice - Math.floor(sellprice/10))
                    }
                    console.log(`Good buy already announced\n`)
                }else{
                    console.log(`Bad buy\n`)
                }
            }
        }else{
            console.log(`Failed to get item's price history`)
        }
      })
      .catch(function (error) {
        console.log(error);
      });
  }

//search through the most recent 4 listings
function search(){
  axios.post('https://voxiom.io/market/public', {
      search: ``,
      sort: "MOST_RECENT"
    })
    .then(function (response) {
      var result = response.data.data.market_items
      if(response.data.success){
          console.log(`Successfully got ${result.length} market items from search`)
          for (var i = 3 - 1; i >= 0; i--) {//change the three in here if you want more listings to be checked (not really neccicary)
              console.log(`ID: ${result[i].item_id} | Price: ${result[i].price}`)
              getdeal(result[i].item_id,result[i].price)
          }
      }else{
          console.log(`Failed to get market items`)
      }
    })
    .catch(function (error) {
      console.log(error);
    });
}

//its lazy I know, dont judge
function botloop(){
  search()

  setTimeout(botloop, 5000)//lower refresh times may cause you to be ratelimited 5000 is a very safe number
}
botloop()
