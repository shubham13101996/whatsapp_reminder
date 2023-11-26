require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

//APP config
const app = express();
app.use(express.json());
app.use(express.urlencoded());
app.use(cors());

//DB config
 mongoose.connect(
  "mongodb://127.0.0.1:27017/reminderAppDB",
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }
  
);
const reminderSchema = new mongoose.Schema({
  reminderMsg: String,
  remindAt: String,
  isReminded: Boolean,
});
const Reminder = new mongoose.model("reminder", reminderSchema);

//Whatsapp reminding functionality

setInterval(async () => {
  try {
    const reminderList = await Reminder.find({});

    if (reminderList) {
      reminderList.forEach((reminder) => {
        if (!reminder.isReminded) {
          const now = new Date();
          if (new Date(reminder.remindAt) - now < 0) {
            Reminder.findByIdAndUpdate(reminder._id, { isReminded: true });

            const accountSid = process.env.ACCOUNT_SID;
            const authToken = process.env.AUTH_TOKEN;
            const client = require("twilio")(accountSid, authToken);
            client.messages
              .create({
                body: reminder.reminderMsg,
                from: "whatsapp:+14155238886",
                to: "whatsapp:+91XXXXXXXXXX", //YOUR PHONE NUMBER INSTEAD OF XXXXXXXXXX
              })
              .then((message) => console.log(message.sid))
              .done();
          }
        }
      });
    }
  } catch (error) {
    res.send({
      message: "Something went wrong",
      error: error.message,
    });
  }
}, 1000);

//API routes
app.get("/getAllReminder", async (req, res) => {
  try {
    const reminderList = await Reminder.find({});

    if (reminderList) {
      res.send(reminderList);
    }
  } catch (error) {
    res.send({
      message: "Something went wrong",
      error: error.message,
    });
  }
});

app.post("/addReminder", async (req, res) => {
  try {
    const { reminderMsg, remindAt } = req.body;
    const reminder = new Reminder({
      reminderMsg,
      remindAt,
      isReminded: false,
    });

    await reminder.save();

    const reminderList = await Reminder.find({});

    if (reminderList) {
      res.send(reminderList);
    }
  } catch (error) {
    res.send({
      message: "Something went wrong",
      error: error.message,
    });
  }
});

app.post("/deleteReminder", async (req, res) => {
  try {
    await Reminder.deleteOne({ _id: req.body.id });
    const reminderList = await Reminder.find({});
   
    if (reminderList) {
      res.send(reminderList);
    }
  } catch (error) {
    res.send({
      message: "Something went wrong",
      error: error.message,
    });
  }
});

app.listen(9000, () => console.log("Be started"));
