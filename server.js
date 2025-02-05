const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const port = 3022;
const app = express();

app.use(express.static(__dirname));
app.use(express.urlencoded({ extended: true }));
app.use(express.json()); // To parse JSON bodies



// MongoDB connection
mongoose.connect('mongodb://127.0.0.1:27017/users', { useNewUrlParser: true, useUnifiedTopology: true });
const db = mongoose.connection;

db.once('open', () => {
    console.log("MongoDB connection successful");
});

// User schema
const userSchema = new mongoose.Schema({
    name: String,
    email: String,
    pass: String,
});
const Users = mongoose.model("User", userSchema);

// Order schema
const orderSchema = new mongoose.Schema({
    userName: String,
    userPhone: String,
    itemName: String,
    itemPrice: Number,
    quantity: Number,
    totalCost: Number,
    orderId: String,
    timestamp: { type: Date, default: Date.now }
});
const Orders = mongoose.model("Order", orderSchema);

// Registration route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, "registration.html"));
});

app.post('/post', async (req, res) => {
    const { name, email, pass } = req.body;

    if (!name || !email || !pass) {
        return res.send("All fields are required. <a href='registration.html'>Go back</a>");
    }

    const user = new Users({ name, email, pass});
    await user.save();
    console.log(user);
    res.redirect('/main');
});

// Login route
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, "login.html"));
});

app.post('/login', async (req, res) => {
    const { email, pass } = req.body;
    const user = await Users.findOne({ email, pass });
    console.log(user);
    if (user) {
        res.redirect('/main');  // Redirect to main page after successful login
    } else {
        res.status(401).send('Invalid email or password');
    }
});

// Main page route
app.get('/main', (req, res) => {
    res.sendFile(path.join(__dirname, "main.html"));
});

// Checkout route to display order summary and process the order (POST method)
app.post('/checkout', async (req, res) => {
    const { userName, userPhone, cartItems } = req.body;

    if (!userName || !userPhone || !cartItems) {
        return res.status(400).send('User name, phone number, and cart items are required.');
    }

    // Parse cartItems from JSON string
    const cart = JSON.parse(cartItems);

    if (cart.length === 0) {
        return res.status(400).send('No items in your cart.');
    }

    // Generate a unique order ID based on timestamp (you can use UUID for more complex IDs)
    const orderId = Date.now().toString();  // Using uuid to create a unique order ID

    // Save each order item into the database with the generated orderId
    for (let item of cart) {
        const order = new Orders({
            userName,
            userPhone,
            itemName: item.itemName,
            itemPrice: item.itemPrice,
            quantity: item.quantity,
            totalCost: item.itemPrice * item.quantity,
            orderId, 
        });
        await order.save();
    }

    // Calculate total cost of all items in the cart
    const totalCost = cart.reduce((sum, item) => sum + (item.itemPrice * item.quantity), 0);

    // Send a confirmation response
    res.status(200).send(`Order successfully placed! Your Order ID: ${orderId} Total cost: &#8377;${totalCost}`);
});


// Start the server
app.listen(port, () => {
    console.log(`Server started on http://localhost:${port}`);
});
