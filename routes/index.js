var express = require('express');
var router = express.Router();
const axios = require('axios');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index');
});

router.post('/search', function(req, res, next) {
  axios.get(`https://api.discogs.com/database/search?q=${req.body.query}&{?type,title,release_title,credit,artist,anv,label,genre,style,country,year,format,catno,barcode,track,submitter,contributor}&key=${process.env.DISCOGS_CONSUMER_KEY}&secret=${process.env.DISCOGS_CONSUMER_SECRET}`)
    .then(function(response) {
      var cover_image = response.data.results[0].cover_image;
      var title = response.data.results[0].title;

      async function createImage() {
        const payload = {
          html: `<div style="height: 200px; width: 200px; border: 10px solid #000000;"><img style="height: 200px; width: 200px;" src="${cover_image}" alt="${title}" crossorigin="anonymous"></div>`
        };

        let headers = {
           auth: {
             username: process.env.HCTI_USER_ID,
             password: process.env.HCTI_API_KEY
           },
           headers: {
             'Content-Type': 'application/json'
           }
        }

        try {
          const response2 = await axios.post('https://hcti.io/v1/image', JSON.stringify(payload), headers);
          res.render('index', {
            title: title,
            image_url: response2.data.url
          });
        } catch (error) {
          console.error(error);
        }
      }
      createImage();
    })
    .catch(function(error) {
      console.log(error);
      res.render(error);
    })
})

module.exports = router;
