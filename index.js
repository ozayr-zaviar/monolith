const sequelize = require('./database');
var bodyParser = require('body-parser');
const cors = require('cors');
const { User, Magazine, Subscription } = require('./models');
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const { spawn } = require('child_process');

const app = express();
app.use(cors());
const port = process.env.PORT || 80;
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
const reactServerURL = "http://127.0.0.1:4173/"; 
app.use(express.static(reactServerURL));

sequelize.sync({ force: true }).then(() => {
  console.log('Database synced!');
});

app.get('/', createProxyMiddleware({
  target: reactServerURL,
  changeOrigin: true,
  proxyTimeout: 60000,
}));

// Redirect requests for CSS and JavaScript files to the remote server
app.get('/test', (req, res) => {
  res.status(200).send('Hello World');
});

// Redirect requests for CSS and JavaScript files to the remote server
app.get('/index.css', createProxyMiddleware({
  target: reactServerURL,
  changeOrigin: true,
  proxyTimeout: 60000,
}));

app.get('/index.js', createProxyMiddleware({
  target: reactServerURL,
  changeOrigin: true,
  proxyTimeout: 60000,
}));

app.use('/image1.jpg', createProxyMiddleware({
  target: reactServerURL,
  changeOrigin: true,
  proxyTimeout: 60000,
}));

app.use('/image2.jpg', createProxyMiddleware({
  target: reactServerURL,
  changeOrigin: true,
  proxyTimeout: 60000,
}));

app.use('/image3.jpg', createProxyMiddleware({
  target: reactServerURL,
  changeOrigin: true,
  proxyTimeout: 60000,
}));

app.use('/static', createProxyMiddleware({
  target: reactServerURL,
  changeOrigin: true,
  proxyTimeout: 60000,
}));

app.post('/create_user', (req, res) => {
  let data = req.body;
  sequelize.sync().then(() => {
    User.create({
      username: data.username,
      email: data.email,
      password: data.password
    }).then(resp=> {
        res.status(200).send("user created")
    }).catch((error) => {
      console.log(error)
      res.status(500).send(`Failed to create a new record: ${JSON.stringify(error)}`);
    });
  })
});

app.post('/create_magazine', (req, res) => {
  let data = req.body;
  console.log(data)

  sequelize.sync().then(() => {
    Magazine.create({
      name: data.name,
      publisher: data.publisher
    }).then(resp=> {
        res.status(200).send("magazine created")
    }).catch((error) => {
      console.log(error)
      res.status(500).send(`Failed to create a new record: ${JSON.stringify(error)}`);
    });
  })
});

app.post('/create_subscription', (req, res) => {
  let data = req.body;
  console.log(data)
    
  User.findOne({ where: { username: data.username } })
  .then((user) => {
    if (!user) {
      throw new Error('User not found');
    }

    // Find the magazine based on the magazine name
    Magazine.findOne({ where: { name: data.magazineName } })
      .then((magazine) => {
        if (!magazine) {
          throw new Error('Magazine not found');
        }

        // Create the subscription
        Subscription.create({
          startDate: data.startDate,
          endDate: data.endDate,
          UserId: user.id,
          MagazineId: magazine.id,
        })
          .then(() => {
            res.status(200).send('Subscription created');
          })
          .catch((error) => {
            console.log(error);
            res
              .status(500)
              .send(`Failed to create a new record: ${JSON.stringify(error)}`);
          });
      })
      .catch((error) => {
        console.log(error);
        res
          .status(500)
          .send(`Failed to find the magazine: ${JSON.stringify(error)}`);
      });
  })
  .catch((error) => {
    console.log(error);
    res.status(500).send(`Failed to find the user: ${JSON.stringify(error)}`);
  });
  
});

app.get('/subscriptions', (req, res) => {
  console.log("subscription")
  Subscription.findAll({
    attributes: ['startDate', 'endDate'],
    include: [
      {
        model: User,
        attributes: ['username', 'email'],
      },
      {
        model: Magazine,
        attributes: ['name', 'publisher'],
      },
    ],
  }).then(subscriptions => {
    res.status(200).send(subscriptions)
  }).catch(error => {
    console.error(error);
    res.status(500).send(JSON.stringify(error))
  });
})

app.get('/batch', (req, res) => {
    // Spawn a new Python process
    error_flag = false
    const pythonProcess = spawn('python3', ['batch/job.py']);

    // Listen for data from the Python script
    pythonProcess.stdout.on('data', (data) => {
      console.log(`Received data from Python script: ${data}`);
    });

    // Listen for errors from the Python script
    pythonProcess.stderr.on('data', (data) => {
      console.log("*****ERROR******")
      console.log(data.toString())
      error_flag = true
    });

    // Listen for the Python script to exit
    pythonProcess.on('close', (code) => {
      console.log(`Python script exited with code ${code}`);
    });

    if (!error_flag) {
      res.status(200).send("Job started")
    }
});

 app.listen(port, () => {
  console.log(`Server running on port ${port}`);
}); 