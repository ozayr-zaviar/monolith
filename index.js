const sequelize = require('./database');
var bodyParser = require('body-parser');
const cors = require('cors');
const { User, Magazine, Subscription } = require('./models');
const express = require('express');
const { spawn } = require('child_process');

const app = express();
app.use(cors());
const port = process.env.PORT || 5000;
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

sequelize.sync({ }).then(() => {
  console.log('Database synced!');
});

app.get('/', (req, res) => {
  res.send('Hello, world!');
});

app.post('/create_user', async (req, res) => {
  let data = req.body;
  console.log(data)

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
    
  sequelize.sync().then(() => {
    Subscription.create({
      startDate: data.startDate,
      endDate: data.endDate,
      UserId: data.UserId,
      MagazineId: data.MagazineId,
    }).then(resp=> {
        res.status(200).send("Subscription created")
    }).catch((error) => {
      console.log(error)
      res.status(500).send(`Failed to create a new record: ${JSON.stringify(error)}`);
    });
  })
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
    const pythonProcess = spawn('python3', ['batch/job.py']);

    // Listen for data from the Python script
    pythonProcess.stdout.on('data', (data) => {
      console.log(`Received data from Python script: ${data}`);
    });

    // Listen for errors from the Python script
    pythonProcess.stderr.on('data', (data) => {
      res.status(404).send("job failed")
    });

    // Listen for the Python script to exit
    pythonProcess.on('close', (code) => {
      console.log(`Python script exited with code ${code}`);
    });

    res.status(200).send("Job started")
});

 app.listen(port, () => {
  console.log(`Server running on port ${port}`);
}); 