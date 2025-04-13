const express = require("express")
const contactRouter = express.Router()
const modelContact = require("./contactModel.cjs")
contactRouter.post("/", async (req, res) => {
  const contact = new modelContact({
    userId: req.body.userId,
    message: req.body.message
  })
  await contact.save()
  res.send("success")
})
contactRouter.get("/", async (req, res) => {
  modelContact.find().then(contact => {
    res.json(contact)
  })
})
module.exports = contactRouter;