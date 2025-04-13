const userRouter = require("./userRouter.cjs")
const postRouter = require("./postRouter.cjs")
const contactRouter = require("./contactRouter.cjs")
function route(app) {
 app.use("/user", userRouter)
 app.use("/post", postRouter)
 app.use("/contact", contactRouter)
}
module.exports = route;