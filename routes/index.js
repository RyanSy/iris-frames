const express = require('express');
const router = express.Router();
const axios = require('axios');
const fs = require('fs');
const path =  require('path');

router.get('/', function(req, res) {
  res.render('index');
})

router.post('/search', function(req, res) {
  // search Discogs for LP info and image
  axios.get(`https://api.discogs.com/database/search?q=${req.body.query}&{?type,title,release_title,credit,artist,anv,label,genre,style,country,year,format,catno,barcode,track,submitter,contributor}&key=${process.env.DISCOGS_CONSUMER_KEY}&secret=${process.env.DISCOGS_CONSUMER_SECRET}`)
    .then(function(response) {
      const cover_image = response.data.results[0].cover_image;8
      const title = response.data.results[0].title;
      const imageFileName =  `${title.split(' ').join('')}.jpg`;

      // use hcti.io API to create HTML img element of LP cover image over black frame
      async function createImage() {
        const payload = {
          html: `<div style="height: 100px; width: 100px; border: 10px solid #000000;"><img style="height: 100px; width: 100px;" src="${cover_image}" alt="${title}"></div>`
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

        // save new image created to disk
        try {
          const hctiResponse = await axios.post('https://hcti.io/v1/image', JSON.stringify(payload), headers);
          const imageUrl = hctiResponse.data.url;
          const imageData = await axios({
              method: 'get',
              url: imageUrl,
              responseType: 'stream'
          }).then((response) => {
              return response;
          }).catch((error) => {
              console.log(error);
              res.send('Error getting image data.');
          });
          const writer = imageData.data.pipe(fs.createWriteStream(`./public/images/${imageFileName}`));
          writer.on('finish', () => {
            res.render('index', {
              title: title,
              imageFileName: imageFileName
            })
          })
        } catch (error) {
          console.error(error);
          res.send('Error creating image.');
        }
      }

      createImage();
    })
    .catch(function(error) {
      console.log(error);
      res.render(error);
    })
});

router.post('/download', function(req, res, next) {
  const filePath = path.join(__basedir + '/public/images/' + req.body.imageFileName);
  res.download(filePath, function(err) {
    fs.unlinkSync(filePath);
    if (err) {
      res.send('Error downloading image.')
    }
  });
});

module.exports = router;
